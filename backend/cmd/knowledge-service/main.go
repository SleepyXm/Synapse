package main

import (
	"context"
	"database/sql"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"Synapse/knowledge"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load(".env.knowledge")
	cfg, err := knowledge.LoadConfig()
	if err != nil {
		log.Fatal(err)
	}
	db, err := sql.Open("pgx", cfg.DatabaseURL)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()
	db.SetMaxOpenConns(20)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)
	if err := db.Ping(); err != nil {
		log.Fatalf("knowledge database is not reachable: %v", err)
	}

	service, err := knowledge.NewService(cfg, db)
	if err != nil {
		log.Fatal(err)
	}
	defer service.Close()
	prepareCtx, cancelPrepare := context.WithTimeout(context.Background(), 30*time.Second)
	err = service.PrepareInfrastructureAndResumeIngestion(prepareCtx)
	cancelPrepare()
	if err != nil {
		log.Fatal(err)
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	workerDone := make(chan error, 1)
	go func() {
		err := service.RunWorker(ctx)
		if err != nil {
			stop()
		}
		workerDone <- err
	}()
	server := &http.Server{Addr: cfg.Addr, Handler: service.Router(), ReadHeaderTimeout: 10 * time.Second}
	go func() {
		<-ctx.Done()
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		_ = server.Shutdown(shutdownCtx)
	}()
	log.Printf("knowledge service listening on %s", cfg.Addr)
	serveErr := server.ListenAndServe()
	stop()
	if workerErr := <-workerDone; workerErr != nil {
		log.Printf("knowledge worker stopped: %v", workerErr)
	}
	if serveErr != nil && !errors.Is(serveErr, http.ErrServerClosed) {
		log.Fatal(serveErr)
	}
}
