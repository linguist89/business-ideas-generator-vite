import React, { useEffect, useState } from "react";
import "./ResultsTable.css";
import {
  getContextInfoOpenAITest,
  getStartingInfoOpenAITest,
  updateFirebaseWithTokens,
} from "./HelperFunctions";
import ContextDialog from "./ContextDialog";
import HowToDialog from "./HowToDialog";
import logo from "./assets/images/site_logo.png";
import { SelectedIdeaContext } from "./BodyComponent";
import { UserContext } from "./App";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "./Firebase.jsx";
import PdfIcon from "./assets/images/PdfIcon.svg?component";
import { CreditContext } from "./App";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function sanitizeTitle(title) {
  const sanitizedTitle = title.replace(/[^a-zA-Z]/g, "_");
  return sanitizedTitle.slice(0, 50);
}

function ResultsTable({ products, title, setShowLoginDialog }) {
  const { user } = React.useContext(UserContext);
  const { credits, setCredits } = React.useContext(CreditContext);
  const [ideaContexts, setIdeaContexts] = React.useState([]);
  const [howToStart, setHowToStart] = React.useState([]);
  const [loading, setLoading] = React.useState({});
  const [startLoading, setStartLoading] = React.useState({});
  const [creatingPdf, setCreatingPdf] = React.useState(false);
  const [logoBase64, setLogoBase64] = useState("");
  const { selectedIdea } = React.useContext(SelectedIdeaContext);
  const [selectedAccordionIndex, setSelectedAccordionIndex] = useState(null);

  useEffect(() => {
    fetch(logo)
      .then((response) => response.blob())
      .then((blob) => {
        var reader = new FileReader();
        reader.onload = function () {
          setLogoBase64(this.result);
        };
        reader.readAsDataURL(blob);
      });
  }, []);

  async function handleStartButtonClick(product, index, retryCount = 0) {
    if (!user) {
      setShowLoginDialog(true);
    } else {
      if (howToStart[index] && howToStart[index]["Creating the product"]) {
        alert(JSON.stringify(howToStart[index]));
      } else {
        setStartLoading((prevStartLoading) => ({
          ...prevStartLoading,
          [index]: true,
        }));
        try {
          const results = await getStartingInfoOpenAITest(product);
          let howToStartResults = JSON.parse(
            results.data.choices[0].message.content
          );
          console.log("Results");
          console.log(howToStartResults);

          setHowToStart((prevTasks) => {
            const newTasks = [...prevTasks];
            newTasks[index] = { ...newTasks[index], ...howToStartResults };
            return newTasks;
          });

          const ideaDoc = doc(db, "customers", user.uid, "ideas", selectedIdea);
          await updateDoc(ideaDoc, {
            ideas: products.map((p, i) =>
              i === index ? { ...p, ...howToStartResults } : p
            ),
          });
          await updateFirebaseWithTokens(results, credits, setCredits, user);
        } catch (error) {
          console.error(error);
          if (retryCount < 5) {
            console.log(`Retrying... (${retryCount + 1})`);
            handleStartButtonClick(product, index, retryCount + 1);
          }
        } finally {
          setStartLoading((prevStartLoading) => ({
            ...prevStartLoading,
            [index]: false,
          }));
        }
      }
    }
  }

  async function handleButtonClick(product, index, retryCount = 0) {
    if (!user) {
      setShowLoginDialog(true);
    } else {
      if (ideaContexts[index]) {
        alert(JSON.stringify(ideaContexts[index]));
      } else {
        setLoading((prevLoading) => ({ ...prevLoading, [index]: true }));
        try {
          const results = await getContextInfoOpenAITest(product);
          console.log("Raw results:");
          console.log(results);
          let optimizedResults = JSON.parse(
            results.data.choices[0].message.content
          );
          console.log("Results");
          console.log(optimizedResults);

          setIdeaContexts((prevTasks) => {
            const newTasks = [...prevTasks];
            newTasks[index] = optimizedResults;
            return newTasks;
          });

          const ideaDoc = doc(db, "customers", user.uid, "ideas", selectedIdea);
          await updateDoc(ideaDoc, {
            ideas: products.map((p, i) =>
              i === index ? { ...p, ...optimizedResults } : p
            ),
          });
          await updateFirebaseWithTokens(results, credits, setCredits, user);
        } catch (error) {
          console.error(error);
          if (retryCount < 5) {
            console.log(`Retrying... (${retryCount + 1})`);
            handleButtonClick(product, index, retryCount + 1);
          }
        } finally {
          setLoading((prevLoading) => ({ ...prevLoading, [index]: false }));
        }
      }
    }
  }

  async function singleIdeaPdf(product) {
    if (!user) {
      setShowLoginDialog(true);
    } else {
      setCreatingPdf(true);

      const sanitizedTitle = sanitizeTitle(product.product);
      const filename = `${sanitizedTitle}.pdf`;

      const doc = new jsPDF();

      // Add title
      doc.setFontSize(22);
      doc.text(product.product, 10, 10);

      // Add content
      doc.setFontSize(16);
      doc.text(`Product: ${product.product}`, 10, 30);
      doc.text(`Description: ${product.description}`, 10, 40);
      doc.text(`Potential Clients: ${product.potentialClients}`, 10, 50);
      doc.text(
        `Where to find the clients: ${product.whereToFindClients}`,
        10,
        60
      );
      doc.text(
        `Creating the product: ${product["Creating the product"]}`,
        10,
        70
      );
      doc.text(`Finding customers: ${product["Finding customers"]}`, 10, 80);
      doc.text(`Selling product: ${product["Selling product"]}`, 10, 90);
      doc.text(
        `Consumer Pain Point: ${product["Consumer Pain Point"]
          .map((obj) => obj.point)
          .join("\n")}`,
        10,
        100
      );
      doc.text(
        `Effort: ${product["Effort"].map((obj) => obj.point).join("\n")}`,
        10,
        110
      );
      doc.text(
        `Time: ${product["Time"]
          .map((obj) => Object.values(obj)[0])
          .join("\n")}`,
        10,
        120
      );

      // You can adjust the positions as per your requirement

      doc.save(filename);
      setCreatingPdf(false);
    }
  }

  async function createAndDownloadPdf(title) {
    if (!user) {
      setShowLoginDialog(true);
    } else {
      const doc = new jsPDF();

      let headers = [
        [
          "Product",
          "Description",
          "Potential Clients",
          "Where to find the clients",
        ],
      ];

      let data = products.map((product) => [
        product.product,
        product.description,
        product.potentialClients,
        product.whereToFindClients,
      ]);

      doc.setFontSize(22);
      doc.text(title, 10, 10);
      doc.setFontSize(16);

      autoTable(doc, {
        startY: 30, // start after the title
        head: headers,
        body: data,
        styles: { fillColor: [255, 255, 255], textColor: 20, fontSize: 10 },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 50 },
          2: { cellWidth: 50 },
          3: { cellWidth: 50 },
        }, // Adjust cellWidths as needed
      });

      doc.save(`${title}.pdf`);
    }
  }

  return (
    <div className="ResultsTable">
      <div className="DownloadButtonWrapper">
        <button
          className="solid-card-button PDFButton"
          onClick={() => createAndDownloadPdf(title)}
        >
          <img src={PdfIcon} alt="Pdf Icon"></img>
          {creatingPdf ? "Creating PDF..." : "Download PDF for all ideas"}
        </button>
      </div>
      <table id="table-section">
        <thead>
          <tr>
            <th>Product</th>
            <th>Description</th>
            <th>Potential Clients</th>
            <th>Where to find the clients</th>
            <th>More Info</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product, index) => (
            <>
              <tr key={index}>
                <td>{product["product"]}</td>
                <td>{product["description"]}</td>
                <td>{product["potentialClients"]}</td>
                <td>{product["whereToFindClients"]}</td>
                <td>
                  <button
                    className="solid-card-button"
                    onClick={() => {
                      setSelectedAccordionIndex(
                        selectedAccordionIndex === index ? null : index
                      );
                    }}
                  >
                    {selectedAccordionIndex === index
                      ? "Less info"
                      : "More info"}
                  </button>
                </td>
              </tr>
              {selectedAccordionIndex === index && (
                <tr key={`accordion-${index}`}>
                  <td colSpan="5">
                    <div className="AccordionMenuWrapper">
                      <div className="MoreInfoWrapper">
                        <div>
                          {product["Creating the product"].length > 0 &&
                          product["Finding customers"].length > 0 &&
                          product["Selling product"].length > 0 ? (
                            <HowToDialog content={product}></HowToDialog>
                          ) : startLoading[index] ? (
                            <span>Loading...</span>
                          ) : howToStart[index] ? (
                            <HowToDialog
                              content={howToStart[index]}
                            ></HowToDialog>
                          ) : (
                            <button
                              onClick={() =>
                                handleStartButtonClick(product, index)
                              }
                              className="solid-card-button"
                            >
                              Find out how to start
                            </button>
                          )}
                        </div>
                        <div>
                          {product["Consumer Pain Point"].length > 0 &&
                          product["Effort"].length > 0 &&
                          product["Time"].length > 0 ? (
                            <ContextDialog
                              content={product}
                              title={product["product"]}
                            ></ContextDialog>
                          ) : loading[index] ? (
                            <span>Loading...</span>
                          ) : ideaContexts[index] ? (
                            <ContextDialog
                              content={ideaContexts[index]}
                              title={product["product"]}
                            ></ContextDialog>
                          ) : (
                            <button
                              onClick={() => handleButtonClick(product, index)}
                              className="solid-card-button"
                            >
                              Get Offering Optimization
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="SinglePDFWrapper">
                        <button
                          className="SinglePDF solid-card-button PDFButton"
                          onClick={() => {
                            singleIdeaPdf(product);
                          }}
                        >
                          <img src={PdfIcon} alt="Pdf Icon"></img>
                          Download PDF for this idea
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ResultsTable;
