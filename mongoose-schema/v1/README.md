update or delete validatoin that requires mixed documents' fields cannot be implemented as query middleware,
as there is no way to get fields of the documents in those callback.

For example when updating priceTier of a ticket, we need to check whether the new priceTier value are in the associated event or not.
We need eventId of the document, and new priceTier value from the update query.

These info are avaliable only in document middleware.
If we 1. find the document; 2. set the fields; 3. call save method, we can validate these fields.
For prohibiting use of query middle ware as well as query calls, error are throw in: 
```
pre('updateOne', { document: false, query: true }, () => {
  throw new Error(
    "Please use find(ById) and chain save afterwards, as referential checking needs documents")
})
pre("findOneAndDelete", () => {
  throw new Error(
    "Please use find(ById) and chain delete afterwards, as referential checking needs " +
    "foreign key in document fields thus has to be executed in document middleware")
});
``` 
This approach enable a more robust referential integratiy checking mechanism but have overhead in more round-trip time.

Can add custom options in query calls and update middleware implementation for allowing these query for flexibility.
https://github.com/Automattic/mongoose/issues/7092
```
pre('updateOne', { document: false, query: true }, () => {
  if(!this.options.doNotThrowError)
    throw new Error(
      "Please use find(ById) and chain save afterwards, as referential checking needs documents")
})
pre("findOneAndDelete", () => {
  if(!this.options.doNotThrowError)
    throw new Error(
      "Please use find(ById) and chain delete afterwards, as referential checking needs " +
      "foreign key in document fields thus has to be executed in document middleware")
});
```

An ultimate approach of enabling query middleware with robust referential integrity validation would be:
1. for delete query, append condition to the filter such that the query only matches deletable document.
2. for update query, replace the query with aggregate, as $lookup is not avaliable for filter parameter for querys `updateone`. Analyze the update modifications and appends condition to the filter that filter out everything if the modification is prohibited. For examples, if use update the priceTier of ticket x with `updateOne({ _id: objectId }, {$set: { priceTier: val } })` we change the query to aggregate as follows :
```
{ $match: { _id: objectId } },
{
    $lookup:
    {
        from: EventDAO.collection_name,
        localField: "eventId",
        foreignField: "_id",
        as: "event",
    }

},
{ $set: { 'event': { $first: '$event' } } },
{ $match: {'event.priceTier': val } },
{ $set: {priceTier: val } }
```

Task 2 is too complex:
1. as the input of the query could be document or pipeline. https://www.mongodb.com/docs/manual/reference/method/db.collection.updateOne/
2. The implementation is not intuitive, easy to make mistake. Better to use if we have automated unit test.
