update or delete validatoin that requires documents' field cannot be implemented as query middleware
as there is no way to get fields of the docuemtns in those callback.
These info are avaliable only in document middleware.
if we 1. find the document; 2. set the fields; 3. call save method, we can validate these fields.
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
