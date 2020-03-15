"""
This script is used to view the contents of
the FDBs so you don't have to SSH into them.
"""
import requests
import json
from pymongo import MongoClient

response = requests.get('http://35.224.26.195:4000/instances')

if response.status_code == 200:
    response_json = response.json()
    all_fdbs = response_json["fdbs"]

    # For each FDB print out all of it's contents
    for fdb in all_fdbs:
        fdb_name = fdb["id"]
        fdb_ip = fdb["publicIp"]

        client = MongoClient("mongodb://{}:80".format(fdb_ip))
        db = client.FDB

        cursor = db.fileInformation.find({})
        if cursor.count() > 0:
            print("Printing contents from fileInformation collection of {} \n".format(fdb_name))
            for document in cursor:
                print(document)
            print("______________________________________________________")
        else:
            print("No content in {}".format(fdb_name))
            print("______________________________________________________")

else:
    print("Request failed")