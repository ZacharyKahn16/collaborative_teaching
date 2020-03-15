# Legend

## make-database.bash

Creates one database instance on Compute Engine

## make-master.bash

Creates a master that will create all other components of our cluster including
all workers, and FDBs.

## viewFDBS.py

A Python script that you can use to view all of the contents of our FDBs. This can
be used for debugging purposes.

    1. pip install -r requirements.txt
    2. python3 viewFDBS.py
