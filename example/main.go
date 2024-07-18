package main

import (
	"flag"
	"log"

	"github.com/kahlys/boa"
	"github.com/kahlys/boa/example/cli"
)

func main() {
	port := flag.Int("port", 8080, "port to listen on")
	flag.Parse()

	log.SetFlags(0)

	server, err := boa.New(cli.NewCommand(), *port)
	if err != nil {
		log.Fatalf("failed to create server: %v", err)
	}

	server.ListenAndServe()
}
