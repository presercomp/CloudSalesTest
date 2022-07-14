/* eslint-disable max-len */
/* eslint-disable no-unused-vars */
const express = require("express");
const cors = require("cors");
const app = express();

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const serviceAccount = require("./private/credentials.json");
const sensibleData = require("./private/sensibleData.json");
const {v4: uuidv4} = require("uuid");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://cloud-sales-da995.firebaseio.com",
});
const db = admin.firestore();

const superAdminPassword = sensibleData.secret;

const clientFields = ["rol", "name"];
const operatorsFields = ["name", "mail"];
const productFields = ["name", "MSU", "price", "stock", "MDPrice", "MDPercentage"];
const salesFields = ["date", "sellerId", "amount", "tax", "otherTaxs", "total", "details"];
const userFields = ["name", "nickname", "password", "level"];

app.use(cors({origin: "*"}));

app.get("/api/clients", async (req, res) => {
  return res.status(400).json({
    message: "OperatorID is required",
    data: null,
  });
});

app.get("/api/clients/:operatorId", async (req, res) => {
  if (!req.params || !req.params.operatorId) {
    return res.status(400).json({
      message: "Missing fields required for query",
      data: {
        "requiredParams": ["operatorId"],
        "requireData": [],
      }});
  }
  const validateOperator = await db.collection("operators").doc(req.params.operatorId).get();
  if (!validateOperator.exists) {
    return res.status(400).json({
      message: "OperatorID not found",
      data: null,
    });
  }
  try {
    const querySnapshot = await db.collection("clients").where("operatorId", "==", req.params.operatorId).get();
    const docs = querySnapshot.docs;
    const response = docs.map((doc) =>({
      "id": doc.id,
      "name": doc.data().name,
      "rol": doc.data().rol,
      "active": doc.data().active,
    }));

    return res.status(200).json({
      message: "Query successful",
      data: response,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      data: error,
    });
  }
});

app.get("/api/clients/:operatorId/:clientId", async (req, res) => {
  if (!req.params || !req.params.operatorId) {
    return res.status(400).json({
      message: "Missing fields required for query",
      data: {
        "requiredParams": ["operatorId", "clientId"],
        "requireData": [],
      }});
  }
  const validateOperator = await db.collection("operators").doc(req.params.operatorId).get();
  if (!validateOperator.exists) {
    return res.status(400).json({
      message: "OperatorID not found",
      data: null,
    });
  }
  const querySnapshot = await db.collection("clients").where("operatorId", "==", req.params.operatorId).where("id", "==", req.params.clientId).get();
  const docs = querySnapshot.docs;
  if (docs.length === 0) {
    return res.status(400).json({
      message: "ClientID don't belong to Operator",
      data: null,
    });
  } else {
    const response = docs.map((doc) =>({
      "id": doc.id,
      "name": doc.data().name,
      "rol": doc.data().rol,
      "active": doc.data().active,
    }));
    return res.status(200).json({
      message: "Query successful",
      data: response,
    });
  }
});

app.post("/api/clients", async (req, res) => {
  const fields = [...clientFields];
  fields.push("operatorId");
  if (!req.body || !fields.every((field) => field in req.body)) {
    return res.status(400).json({
      message: "Missing fields required for query",
      data: {
        "requiredParams": [],
        "requireData": fields,
      },
    });
  }
  const clientId = uuidv4();
  await db.collection("clients").doc(clientId).set({
    id: clientId,
    rol: req.body.rol,
    name: req.body.name,
    operatorId: req.body.operatorId,
    active: true,
  });
  return res.status(201).json({message: "Client created successfully", data: {"clientId": clientId}});
});

app.put("/api/clients", async (req, res) => {
  return res.status(400).json({message: "Missing ClientID in URL request parameters", data: []});
});

app.put("/api/clients/:clientId", async (req, res) => {
  const fields = [...clientFields];
  fields.push("operatorId");
  fields.push("active");
  if (!req.body || !fields.every((field) => field in req.body) || !req.params.clientId) {
    return res.status(400).json({
      message: "Missing fields required for query",
      data: {
        "requiredParams": ["clientId"],
        "requireData": fields,
      },
    });
  }
  const validateOperator = await db.collection("operators").doc(req.body.operatorId).get();
  if (!validateOperator.exists) {
    return res.status(400).json({
      message: "OperatorID not found",
      data: null,
    });
  }
  const querySnapshot = await db.collection("clients").where("operatorId", "==", req.body.operatorId).where("id", "==", req.params.clientId).get();
  const docs = querySnapshot.docs;
  if (docs.length === 0) {
    return res.status(400).json({
      message: "ClientID don't belong to Operator",
      data: null,
    });
  }

  await db.collection("clients").doc(req.params.clientId).update({
    rol: req.body.rol,
    name: req.body.name,
    operatorId: req.body.operatorId,
    active: req.body.active,
  });
  return res.status(200).json({message: "Client update successfully", data: []});
});

app.get("/api/operators", async (req, res) => {
  return res.status(403).json({
    message: "This endpoint require authentication",
    data: null,
  });
});

app.get("/api/operators/:superAdminPassword", async (req, res) => {
  if (!req.params || !req.params.superAdminPassword) {
    return res.status(403).json({
      message: "This endpoint require authentication",
      data: {
        "requiredParams": [],
        "requireData": ["superAdminPassword"],
      },
    });
  }
  if (req.params.superAdminPassword !== superAdminPassword) {
    return res.status(403).json({
      message: "Invalid super admin password",
      data: null,
    });
  }
  try {
    const querySnapshot = await db.collection("operators").get();
    const docs = querySnapshot.docs;
    const response = docs.map((doc) =>({
      "id": doc.id,
      "name": doc.data().name,
      "mail": doc.data().mail,
      "active": doc.data().active,
    }));

    return res.status(200).json({
      message: "Query successful",
      data: response,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      data: error,
    });
  }
});

app.get("/api/operators/:superAdminPassword/:operatorId", async (req, res) => {
  if (!req.params || !req.params.operatorId || !req.params.superAdminPassword) {
    return res.status(400).json({
      message: "Missing fields required for query and endpoint required authentication",
      data: {
        "requiredParams": ["operatorId"],
        "requireData": [],
      },
    });
  }
  if (req.params.superAdminPassword !== superAdminPassword) {
    return res.status(403).json({
      message: "Invalid super admin password",
      data: null,
    });
  }
  const querySnapshot = await db.collection("operators").doc(req.params.operatorId).get();
  const doc = querySnapshot.data();
  const data = {
    "id": doc.id,
    "name": doc.name,
    "mail": doc.mail,
    "active": doc.active,
  };
  return res.status(200).json({
    message: "Query Successful",
    data: data,
  });
});

app.post("/api/operators", async (req, res) => {
  const fields = [...operatorsFields];
  fields.push("superAdminPassword");
  if (!req.body || !fields.every((field) => field in req.body)) {
    return res.status(400).json({
      message: "Missing fields required for query and endpoint require authentication",
      data: {
        "requiredParams": [],
        "requireData": [fields],
      },
    });
  }
  if (req.body.superAdminPassword !== superAdminPassword) {
    return res.status(403).json({
      message: "Invalid super admin password",
      data: null,
    });
  }
  const operatorId = uuidv4();
  await db.collection("operators").doc(operatorId).set({
    "id": operatorId,
    "name": req.body.name,
    "mail": req.body.mail,
    "active": true,
  });
  return res.status(201).json({message: "Operator created successfully", data: {"operatorId": operatorId}});
});

app.put("/api/operators", async (req, res) => {
  return res.status(403).json({message: "Missing OperatorID in URL request parameters and endpoint require authentication", data: []});
});

app.put("/api/operators/:operatorId", async (req, res) => {
  const fields = operatorsFields;
  fields.push("superAdminPassword");
  if (!req.body || !fields.every((field) => field in req.body) || !req.params.operatorId) {
    return res.status(400).json({
      message: "Missing fields required for query",
      data: {
        "requiredParams": ["operatorId"],
        "requireData": fields,
      },
    });
  }
  if (req.body.superAdminPassword !== superAdminPassword) {
    return res.status(403).json({
      message: "Invalid super admin password",
      data: null,
    });
  }
  await db.collection("operators").doc(req.params.operatorId).update({
    "name": req.body.name,
    "mail": req.body.mail,
    "active": true,
  });
  return res.status(200).json({message: "Operator update successfully", data: []});
}
);


app.get("/api/products/:operatorId", async (req, res) => {
  if (!req.params || !req.params.operatorId) {
    return res.status(400).json({
      message: "Missing fields required for query",
      data: {
        "requiredParams": ["operatorId"],
        "requireData": [],
      },
    });
  }
  const validateOperator = await db.collection("operators").doc(req.params.operatorId).get();
  if (!validateOperator.exists) {
    return res.status(400).json({
      message: "OperatorID not found",
      data: null,
    });
  }
  try {
    const querySnapshot = await db.collection("products").where("operatorId", "==", req.params.operatorId).get();
    const docs = querySnapshot.docs;
    const response = docs.map((doc) =>({
      "id": doc.id,
      "name": doc.data().name,
      "MSU": doc.data().MSU,
      "price": doc.data().price,
      "stock": doc.data().stock,
      "MDPrice": doc.data().MDPrice,
      "MDPercentage": doc.data().MDPercentage,
      "active": doc.data().active,
    }));

    return res.status(200).json({
      message: "Query successful",
      data: response,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      data: error,
    });
  }
});

app.get("/api/products/:operatorId/:productId", async (req, res) => {
  if (!req.params || !req.params.operatorId || !req.params.productId) {
    return res.status(400).json({
      message: "Missing fields required for query",
      data: {
        "requiredParams": ["operatorId", "productId"],
        "requireData": [],
      },
    });
  }
  const validateOperator = await db.collection("operators").doc(req.params.operatorId).get();
  if (!validateOperator.exists) {
    return res.status(400).json({
      message: "OperatorID not found",
      data: null,
    });
  }
  const querySnapshot = await db.collection("products").where("operatorId", "==", req.params.operatorId).where("id", "==", req.params.productId).get();
  const docs = querySnapshot.docs;
  if (docs.length === 0) {
    return res.status(400).json({
      message: "ProductID don't belong to Operator",
      data: null,
    });
  }
  const response = docs.map((doc) =>({
    "id": doc.id,
    "name": doc.data().name,
    "MSU": doc.data().MSU,
    "price": doc.data().price,
    "stock": doc.data().stock,
    "MDPrice": doc.data().MDPrice,
    "MDPercentage": doc.data().MDPercentage,
    "active": doc.data().active,
  }));

  return res.status(200).json({
    message: "Query Successful",
    data: response,
  });
});

app.post("/api/products", async (req, res) => {
  const fields = productFields;
  fields.push("operatorId");
  if (!req.body || !fields.every((field) => field in req.body)) {
    return res.status(400).json({
      message: "Missing fields required for query",
      data: {
        "requiredParams": [],
        "requireData": [fields],
      },
    });
  }
  const productId = uuidv4();
  await db.collection("products").doc(productId).set({
    "id": productId,
    "name": req.body.name,
    "MSU": req.body.MSU,
    "price": req.body.price,
    "stock": req.body.stock,
    "MDPrice": req.body.MDPrice,
    "MDPercentage": req.body.MDPercentage,
    "operatorId": req.body.operatorId,
    "active": true,
  });
  return res.status(201).json({message: "User created successfully", data: []});
});

app.put("/api/products", async (req, res) => {
  return res.status(400).json({message: "Missing ProductID in URL request parameters ", data: []});
});

app.put("/api/products/:productId", async (req, res) => {
  const fields = productFields;
  fields.push("operatorId");
  if (!req.body || !fields.every((field) => field in req.body) || !req.params.productId) {
    return res.status(400).json({
      message: "Missing fields required for query",
      data: {
        "requiredParams": ["productId"],
        "requireData": fields,
      },
    });
  }
  const productId = req.params.productId;
  const validateOperator = await db.collection("operators").doc(req.body.operatorId).get();
  if (!validateOperator.exists) {
    return res.status(400).json({
      message: "OperatorID not found",
      data: null,
    });
  }
  const querySnapshot = await db.collection("products").where("operatorId", "==", req.body.operatorId).where("id", "==", productId).get();
  if (querySnapshot.empty) {
    return res.status(400).json({
      message: "ProductID don't belong to Operator",
      data: null,
    });
  }
  return await db.collection("products").doc(productId).update({
    id: productId,
    name: req.body.name,
    MSU: req.body.MSU,
    price: req.body.price,
    stock: req.body.stock,
    MDPrice: req.body.MDPrice,
    MDPercentage: req.body.MDPercentage,
    operatorId: req.body.operatorId,
    active: req.body.active,
  }).then(() => {
    return res.status(200).json({message: "Product update successfully", data: []});
  }).catch((error) => {
    return res.status(500).json({message: "Internal Server Error", data: {"document": productId, "errors": error}});
  });
});


app.get("/api/sales/:operatorId", async (req, res) => {
  if (!req.params || !req.params.operatorId) {
    return res.status(400).json({
      message: "Missing fields required for query",
      data: {
        "requiredParams": ["operatorId"],
        "requireData": [],
      },
    });
  }
  const validateOperator = await db.collection("sales").doc(req.params.operatorId).get();
  if (!validateOperator.exists) {
    return res.status(400).json({
      message: "OperatorID not found",
      data: null,
    });
  }
  try {
    const querySnapshot = await db.collection("sales").where("operatorId", "==", req.params.operatorId).get();
    const docs = querySnapshot.docs;
    // ["name", "MSU", "price", "stock", "MDPrice", "MDPercentage"];
    const response = docs.map((doc) =>({
      "id": doc.id,
      "date": doc.data().date,
      "sellerId": doc.data().selerId,
      "amount": doc.data().amount,
      "tax": doc.data().tax,
      "otherTaxs": doc.data().otherTaxs,
      "total": doc.data().total,
      "details": doc.data().details,
      "active": doc.data().active,
    }));

    return res.status(200).json({
      message: "Query successful",
      data: response,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      data: error,
    });
  }
});

app.get("/api/sales/:operatorId/:saleId", async (req, res) => {
  if (!req.params || !req.params.operatorId || !req.params.saleId) {
    return res.status(400).json({
      message: "Missing fields required for query",
      data: {
        "requiredParams": ["operatorId", "saleId"],
        "requireData": [],
      },
    });
  }
  const validateOperator = await db.collection("operators").doc(req.params.operatorId).get();
  if (!validateOperator.exists) {
    return res.status(400).json({
      message: "OperatorID not found",
      data: null,
    });
  }
  const querySnapshot = await db.collection("products").where("operatorId", "==", req.params.operatorId).where("id", "==", req.params.saleId).get();
  const docs = querySnapshot.docs;
  if (docs.length === 0) {
    return res.status(400).json({
      message: "ProductID don't belong to Operator",
      data: null,
    });
  }
  const response = docs.map((doc) =>({
    "id": doc.id,
    "date": doc.data().date,
    "sellerId": doc.data().selerId,
    "amount": doc.data().amount,
    "tax": doc.data().tax,
    "otherTaxs": doc.data().otherTaxs,
    "total": doc.data().total,
    "details": doc.data().details,
    "active": doc.data().active,
  }));
  return res.status(200).json({
    message: "Query Successful",
    data: response,
  });
});

app.post("/api/sales", async (req, res) => {
  const fields = salesFields;
  fields.push("operatorId");
  if (!req.body || !fields.every((field) => field in req.body)) {
    return res.status(400).json({
      message: "Missing fields required for query",
      data: {
        "requiredParams": [],
        "requireData": [fields],
      },
    });
  }
  const saleId = uuidv4();
  await db.collection("sales").doc(saleId).set({
    "id": saleId,
    "date": req.body.date,
    "sellerId": req.body.selerId,
    "operatorId": req.body.operatorId,
    "amount": req.body.amount,
    "tax": req.body.tax,
    "otherTaxs": req.body.otherTaxs,
    "total": req.body.total,
    "details": req.body.details,
    "active": true,
  });
  return res.status(201).json({message: "Sale created successfully", data: []});
});

app.put("/api/sales", async (req, res) => {
  return res.status(400).json({message: "Missing SalesID in URL request parameters ", data: []});
});

app.put("/api/sales/:saleId", async (req, res) => {
  const fields = salesFields;
  fields.push("operatorId");
  if (!req.body || !fields.every((field) => field in req.body) || !req.params.saleId) {
    return res.status(400).json({
      message: "Missing fields required for query",
      data: {
        "requiredParams": ["saleId"],
        "requireData": fields,
      },
    });
  }
  const validateOperator = await db.collection("operators").doc(req.body.operatorId).get();
  if (!validateOperator.exists) {
    return res.status(400).json({
      message: "OperatorID not found",
      data: null,
    });
  }
  const querySnapshot = await db.collection("products").where("operatorId", "==", req.body.operatorId).where("idd", "==", req.params.saleId).get();
  if (querySnapshot.empty) {
    return res.status(400).json({
      message: "SaleID don't belong to Operator",
      data: null,
    });
  }
  await db.collection("sales").doc(req.params.saleId).update({
    "date": req.body.date,
    "sellerId": req.body.selerId,
    "amount": req.body.amount,
    "tax": req.body.tax,
    "otherTaxs": req.body.otherTaxs,
    "total": req.body.total,
    "details": req.body.details,
    "operatorId": req.body.operatorId,
    "active": req.body.active,
  });
  return res.status(200).json({message: "Sale update successfully", data: []});
}
);


app.get("/api/users/:operatorId", async (req, res) => {
  if (!req.params || !req.params.operatorId) {
    return res.status(400).json({
      message: "Missing fields required for query",
      data: {
        "requiredParams": ["operatorId"],
        "requireData": [],
      },
    });
  }
  const validateOperator = await db.collection("operators").doc(req.params.operatorId).get();
  if (!validateOperator.exists) {
    return res.status(400).json({
      message: "OperatorID not found",
      data: null,
    });
  }
  try {
    const querySnapshot = await db.collection("users").where("operatorId", "==", req.params.operatorId).get();
    const docs = querySnapshot.docs;
    const response = docs.map((doc) =>({
      "id": doc.id,
      "name": doc.data().name,
      "nickname": doc.data().nickname,
      "password": doc.data().password,
      "level": doc.data().level,
      "active": doc.data().active,
    }));

    return res.status(200).json({
      message: "Query successful",
      data: response,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      data: error,
    });
  }
});

app.get("/api/users/:operatorId/:userId", async (req, res) => {
  if (!req.params || !req.params.operatorId || !req.params.userId) {
    return res.status(400).json({
      message: "Missing fields required for query",
      data: {
        "requiredParams": ["operatorId", "userId"],
        "requireData": [],
      },
    });
  }
  const validateOperator = await db.collection("operators").doc(req.params.operatorId).get();
  if (!validateOperator.exists) {
    return res.status(400).json({
      message: "OperatorID not found",
      data: null,
    });
  }
  const querySnapshot = await db.collection("users").where("operatorId", "==", req.params.operatorId).where("id", "==", req.params.userId).get();
  const docs = querySnapshot.docs;
  if (docs.length === 0) {
    return res.status(400).json({
      message: "UserID don't belong to Operator",
      data: null,
    });
  }
  const response = docs.map((doc) =>({
    "id": doc.id,
    "name": doc.data().name,
    "nickname": doc.data().nickname,
    "password": doc.data().password,
    "level": doc.data().level,
    "active": doc.data().active,
  }));
  return res.status(200).json({
    message: "Query Successful",
    data: response,
  });
});

app.post("/api/users", async (req, res) => {
  const fields = userFields;
  fields.push("operatorId");
  if (!req.body || !fields.every((field) => field in req.body)) {
    return res.status(400).json({
      message: "Missing fields required for query",
      data: {
        "requiredParams": [],
        "requireData": [fields],
      },
    });
  }
  if (["seller", "admin"].indexOf(req.body.level) === -1) {
    return res.status(400).json({
      message: "Invalid level. Only accept 'seller' or 'admin'",
      data: null,
    });
  }
  const userId = uuidv4();
  await db.collection("users").doc(userId).set({
    "id": userId,
    "name": req.body.name,
    "nickname": req.body.nickname,
    "password": req.body.password,
    "operatorId": req.body.operatorId,
    "level": req.body.level,
    "active": req.body.active,
  });
  return res.status(201).json({message: "User created successfully", data: {"userId": userId}});
});

app.put("/api/users", async (req, res) => {
  return res.status(400).json({message: "Missing UserID in URL request parameters", data: []});
});

app.put("/api/users/:userId", async (req, res) => {
  const fields = [...userFields];
  fields.push("operatorId");
  if (!req.body || !fields.every((field) => field in req.body) || !req.params.userId) {
    return res.status(400).json({
      message: "Missing fields required for query",
      data: {
        "requiredParams": ["userId"],
        "requireData": fields,
      },
    });
  }
  const validateOperator = await db.collection("operators").doc(req.body.operatorId).get();
  if (!validateOperator.exists) {
    return res.status(400).json({
      message: "OperatorID not found",
      data: null,
    });
  }
  const querySnapshot = await db.collection("users").where("operatorId", "==", req.body.operatorId).where("id", "==", req.params.userId).get();
  if (querySnapshot.empty) {
    return res.status(400).json({
      message: "UserID don't belong to Operator",
      data: null,
    });
  }
  await db.collection("users").doc(req.params.userId).update({
    "name": req.body.name,
    "nickname": req.body.nickname,
    "password": req.body.password,
    "level": req.body.level,
    "operatorId": req.body.operatorId,
    "active": req.body.active,
  });
  return res.status(200).json({message: "User update successfully", data: []});
}
);

app.get("/api/login", async (req, res) => {
  return res.status(403).json({message: "Login only work in POST mode", data: []});
});

app.post("/api/login", async (req, res) => {
  if (!req.body || !req.body.nickname || !req.body.password || !req.body.operatorId) {
    return res.status(400).json({
      message: "Missing fields required for query",
      data: {
        "requiredParams": [],
        "requireData": ["nickname", "password", "operatorId"],
      },
    });
  }
  const querySnapshot = await db.collection("users").where("operatorId", "==", req.body.operatorId).where("nickname", "==", req.body.nickname).where("password", "==", req.body.password).get();
  const docs = querySnapshot.docs;
  if (docs.length === 0) {
    return res.status(404).json({
      message: "User not found",
      data: null,
    });
  }
  const response = docs.map((doc) =>({
    "id": doc.id,
    "name": doc.data().name,
    "nickname": doc.data().nickname,
    "password": doc.data().password,
    "level": doc.data().level,
    "active": doc.data().active,
  }));
  return res.status(200).json({
    message: "Login successful",
    data: response,
  });
});

app.put("/api/login", async (req, res) => {
  return res.status(403).json({message: "Login only work in POST mode", data: []});
});

/** COMMON AREA */
app.get("/", (req, res) => {
  return res.status(200).json({message: "Welcome to CloudSales"});
});

app.get("/api", (req, res) => {
  return res.status(200).json({message: "Welcome to CloudSales API"});
});


exports.app = functions.https.onRequest(app);

