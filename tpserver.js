const express = require("express");
const mysql = require("mysql2");
const app = express();
const cors = require('cors');
app.use(cors());

const connection = mysql.createPool({
    connectionLimit: 10,
    host: process.env.MYSQL_HOST || "localhost",
    user: process.env.MYSQL_USER || "root",
    database: process.env.MYSQL_DATABASE || "projet",
});

app.use(express.json());

app.post("/ordre_reparation", (req, res) => {
    let { NomCli, AdrCli, VilleCli, CIN, IDCat, IDApp, DescApp, RefConstApp, MarqueApp, DiagnosticPanne, NbHeuresMO } = req.body;
    let IDCli =CIN; // Declare IDCli here
    if (IDCat === "TV") {
        IDCat = 2;
    } else if (IDCat === "PC") {
        IDCat = 3;
    } else {
        IDCat = 1;
    }

    connection.query("INSERT INTO cliente (IDCli, NomCli, AdrCli, VilleCli) VALUES (?, ?, ?, ?)", [CIN, NomCli, AdrCli, VilleCli], (err, rows) => {
        if (err) {
            console.log("", err);
            res.json({
                success: false,
                error: err,
            });
        } else {
            // Continue with the next query
            connection.query("INSERT INTO appareil (IDApp, DescApp, RefConstApp, MarqueApp, IDCli, IDCat) VALUES (?, ?, ?, ?, ?, ?)", [IDApp, DescApp, RefConstApp, MarqueApp, IDCli, IDCat], (err, rows) => {
                if (err) {
                    console.log("", err);
                    res.json({
                        success: false,
                        error: err,
                    });
                } else {
                    connection.query("INSERT INTO ORDREREPARATION (DiagnosticPanne, NbHeuresMO, IDApp) VALUES (?, ?,?)", [DiagnosticPanne, NbHeuresMO , IDApp],(err)=>{
                        if (err) {
                            console.log("", err);
                            res.json({
                                success: false,
                                error: err,
                            });
                        }else {
                            res.json({
                                success: true,

                            });

                        }
                    })

                }
            });
        }
    });
});
app.post("/facture", (req, res) => {
    const { IDPiece, IDOrdre, Quantite } = req.body;




    // Insert data into 'piecesachanger'
    const insertQuery = "INSERT INTO piecesachanger (IDPiece, IDOrdre, Quantite) VALUES (?, ?, ?)";
    const insertValues = [IDPiece, IDOrdre, Quantite];

    connection.query(insertQuery, insertValues, (err, insertResult) => {
        if (err) {
            console.log("Error inserting data:", err);
            return res.json({
                success: false,
                error: err,
            });
        }

        // Query data based on inserted values
        const selectQuery = "SELECT c.NomCli AS NomClient, SUM(p.PUHT * pac.Quantite) AS MontantHTTotal, SUM(p.PUHT * pac.Quantite * 0.20) AS TVATotal, SUM(p.PUHT * pac.Quantite * 1.20) AS MontantTTCTotal FROM CLIENTE c JOIN APPAREIL a ON c.IDCli = a.IDCli JOIN ORDREREPARATION o ON a.IDApp = o.IDApp LEFT JOIN PIECESACHANGER pac ON o.IDOrdre = pac.IDOrdre LEFT JOIN PIECE p ON pac.IDPiece = p.IDPiece WHERE o.IDOrdre = ? AND p.IDPiece = ? GROUP BY c.NomCli;";
        const selectValues = [IDOrdre, IDPiece];

        connection.query(selectQuery, selectValues, (err, selectResult) => {
            if (err) {
                console.log("Error querying data:", err);
                return res.json({
                    success: false,
                    error: err,
                });
            }else{
                console.log(selectResult)
               return  res.json({
                    selectResult,

                });
            }

            // Process the result (selectResult) here

        });
    });
});

app.get("/chercher_client", (req, res) => {
    const { NomCli } = req.query; // Utilisez req.query pour récupérer les paramètres de l'URL
    connection.query("SELECT * FROM CLIENTE WHERE NomCli = ?", [NomCli], (err, results) => {
        if (err) {
            console.error(err);
            res.json({
                success: false,
                error: err,
            });
        } else {
            res.json({

                results,
            });
        }
    });
});

app.post("/Prechercher", (req, res) => {
    const prix = req.body.prix;
    console.log(prix)// Assuming prixDonne is a property of the request body
    const insertQuery = "SELECT * FROM piece WHERE PUHT > ?";

    connection.query(insertQuery, [prix], (err, result) => {
        if (err) {
            console.log("Error executing query:", err);
            return res.json({
                success: false,
                error: err,
            });
        } else {
            return res.json({
                result,
            });
        }
    });
});
app.post("/Orechercher", (req, res) => {
   // Assuming prixDonne is a property of the request body
    const insertQuery = "SELECT * FROM ORDREREPARATION WHERE IDOrdre NOT IN (SELECT IDOrdre FROM PIECESACHANGER WHERE Quantite > 0 )";

    connection.query(insertQuery, (err, result) => {
        if (err) {
            console.log("Error executing query:", err);
            return res.json({
                success: false,
                error: err,
            });
        } else {
            return res.json({
                result,
            });
        }
    });
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
