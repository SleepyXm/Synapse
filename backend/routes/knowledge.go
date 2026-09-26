package routes

import (
	"database/sql"

	handlers "Synapse/handlers/knowledge"
	"Synapse/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterKnowledgeRoutes(rg *gin.RouterGroup, db *sql.DB) {
	rg.Use(middleware.AuthMiddleware(db))
	rg.GET("", handlers.Proxy)
	rg.POST("", handlers.Proxy)
	documents := rg.Group("/:base_id/documents")
	documents.GET("", handlers.Proxy)
	documents.POST("", handlers.Proxy)
	documents.DELETE("/:document_id", handlers.Proxy)
}
