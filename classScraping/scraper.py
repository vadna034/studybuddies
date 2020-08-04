from bs4 import BeautifulSoup
from pymongo import MongoClient


client = MongoClient('mongodb+srv://shane:Mark_Kelsey_Rae123@users-byzip.mongodb.net/Users?retryWrites=true&w=majority')
db = client['users']
collection = db['classes']
print("connected")

count = 0
with open("classes.html", "r", encoding="utf8") as file:
    for line in file:
        if line[0:19] == '<h2 class="closed">' or line[0:17] == '<h2 class="open">':
            soup = BeautifulSoup(line, 'html.parser')
            
            classArray = soup.h2.string.split()
            term = " ".join(classArray[0:2])
            dept =  classArray[3]
            classNumber = classArray[4]
            classId = classArray[-1][1:-1]

            doc1 = {
                "term": term,
                "dept": dept,
                "classNumber": classNumber,
                "classId": classId,
                "members": [],
            }

            doc2 = {
                "term": term,
                "dept": dept,
                "classNumber": classNumber,
                "classId": "",
                "members": [],
            }

            collection.replace_one(doc1, doc1, upsert=True)
            collection.replace_one(doc2, doc2, upsert=True)

            count = count + 1

            if(count % 100 == 0):
                print(count)
                print(soup)

print(count)