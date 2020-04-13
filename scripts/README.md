# Legend

## make-master.bash

Creates a master that will create all other components of our cluster including
all Workers, and FileDatabases.

## make-worker.bash

Creates one worker instance on Compute Engine

## make-database.bash

Creates one database instance on Compute Engine

## make-website.bash

Creates the front end website on Compute Engine

## viewFDBS.py

A Python script that you can use to view all of the contents of our FDBs. This can
be used for debugging purposes.

    1. pip install -r requirements.txt
    2. python3 viewFDBS.py
