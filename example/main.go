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

	server := boa.New(cli.NewCommand(), *port)
	server.ListenAndServe()
}
