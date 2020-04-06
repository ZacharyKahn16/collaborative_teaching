"""
This script is used to view the contents of
the FDBs so you don't have to SSH into them.
"""
import requests
import json
from pymongo import MongoClient
import time

response = requests.get('http://35.224.26.195:4000/instances')

if response.status_code == 200:
    response_json = response.json()
    all_fdbs = response_json["fdbs"]

    # For each FDB print out all of it's contents
    db_num = 0
    for fdb in all_fdbs:
        fdb_name = fdb["id"]
        fdb_ip = fdb["publicIp"]

        # epoch time before API call
        start = time.time()
        try:
            # attempt to create a client instance of PyMongo driver
            client = MongoClient("mongodb://{}:80".format(fdb_ip), serverSelectionTimeoutMS = 2000)
            client.server_info() # will throw an exception

            db = client.FDB

            cursor = db.fileInformation.find({})
            if cursor.count() > 0:
                print("Printing contents from fileInformation collection of {} \n".format(fdb_name))
                for document in cursor:
                    doc_dict = {
                        "doc_id": document["docId"],
                        "file_name": document["fileName"],
                        "file_hash": document["fileHash"],
                        "file_type": document["fileType"],
                        "owner_id": document["ownerId"],
                        "last_update": document["lastUpdated"]
                    }
                    print(doc_dict)

                print("______________________________________________________")
            else:
                print("No content in {}".format(fdb_name))
                print("______________________________________________________")
        except:
            print("______________________________________________________")
            print("{} is down".format(fdb_name))
            print("______________________________________________________")

        db_num += 1


else:
    print("Request failed")