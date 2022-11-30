const{MongoClient}=require("mongodb");
const url='mongodb://localhst:27017';
const client=new MongoClient(url);
const dbname='serenery';
async function main(){
    let result=await client.connect();
    const db=result.db(dbname);
    collection=db.collection('appointment');
    let data=collection.find({}).toArray();
    
}