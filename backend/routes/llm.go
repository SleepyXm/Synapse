package routes

import (
	"database/sql"

	handlers "Synapse/handlers/llm"
	"Synapse/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterLLMRoutes(rg *gin.RouterGroup, db *sql.DB) {
	auth := middleware.AuthMiddleware(db)
	rg.POST("/chat/stream", auth, handlers.ChatStream(db))
	rg.GET("/customisations", auth, handlers.ListCustomisations(db))
	rg.POST("/customisations", auth, handlers.CreateCustomisation(db))
	rg.PATCH("/customisations/:id", auth, handlers.UpdateCustomisation(db))
	rg.DELETE("/customisations/:id", auth, handlers.DeleteCustomisation(db))
}
