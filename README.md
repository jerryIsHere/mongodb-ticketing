please populate ./credential/.env
node version: v20.11.1
please run npm install in both `./` and `./web`
frontend is also served by express with `npm run start`
node ./tools/user.js --N Suffix
N length of password
node --env-file ./credential/.env ./api/mongoose-schema/v1/tools/clone_venue.js
Suffix add suffix to login user name of every created user
[
  {
    $lookup:
      /**
       * from: The target collection.
       * localField: The local join field.
       * foreignField: The target join field.
       * as: The name for the results.
       * pipeline: Optional pipeline to run on the foreign collection.
       * let: Optional variables to use in the pipeline field stages.
       */
      {
        from: "users",
        localField: "occupantId",
        foreignField: "_id",
        as: "occupant",
      },
  },
  {
    $set:
      /**
       * field: The field name
       * expression: The expression.
       */
      {
        occupant: {
          $first: "$occupant",
        },
      },
  },
  {
    $match:
      /**
       * query: The query in MQL.
       */
      {
        "occupant.email":
          /S1@gmail|S2@gmail|A@yahoo|T@yahoo|B@yahoo/,
      },
  },
]