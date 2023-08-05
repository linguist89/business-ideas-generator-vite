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
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import PdfIcon from "./assets/images/PdfIcon.svg?component";
import { CreditContext } from "./App";

function sanitizeTitle(title) {
  const sanitizedTitle = title.replace(/[^a-zA-Z]/g, "_");
  return sanitizedTitle.slice(0, 50);
}

function ResultsTable({ products, setProducts, title, setShowLoginDialog }) {
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
    console.log("Products");
    console.log(products);
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

  useEffect(() => {
    console.log(products);
  }, []);

  async function handleStartButtonClick(product, index) {
    if (!user) {
      setShowLoginDialog(true);
    } else {
      if (howToStart[index] && howToStart[index]["Creating the product"]) {
        console.log(JSON.stringify(howToStart[index]));
      } else {
        setStartLoading((prevStartLoading) => ({
          ...prevStartLoading,
          [index]: true,
        }));
        try {
          const howToResults = await getStartingInfoOpenAITest(product);
          console.log("Results");
          console.log(howToResults);

          setProducts((prevHowTo) => {
            const newHowTo = [...prevHowTo];
            newHowTo[index] = {
              ...newHowTo[index],
              ...howToResults,
            };
            return newHowTo;
          });

          const ideaDoc = doc(db, "customers", user.uid, "ideas", selectedIdea);
          await updateDoc(ideaDoc, {
            ideas: products.map((p, i) =>
              i === index ? { ...p, ...howToResults } : p
            ),
          });

          // Assuming the 'updateFirebaseWithTokens' function aligns with the new results
          await updateFirebaseWithTokens(
            howToResults,
            credits,
            setCredits,
            user
          );
        } catch (error) {
          console.error(error);
        } finally {
          setStartLoading((prevStartLoading) => ({
            ...prevStartLoading,
            [index]: false,
          }));
        }
      }
    }
  }

  async function handleButtonClick(product, index) {
    if (!user) {
      setShowLoginDialog(true);
    } else {
      if (
        product["Consumer Pain Point"] &&
        product["Effort"] &&
        product["Time"]
      ) {
        console.log(
          `${product["Consumer Pain Point"]} ${product["Effort"]} ${product["Time"]}`
        );
      } else {
        setLoading((prevLoading) => ({ ...prevLoading, [index]: true }));
        try {
          const contextResults = await getContextInfoOpenAITest(product);
          console.log("Raw results:");
          console.log(contextResults);

          setProducts((prevContexts) => {
            const newContexts = [...prevContexts];
            newContexts[index] = {
              ...newContexts[index],
              "Consumer Pain Point": contextResults["Consumer Pain Point"],
              Effort: contextResults["Effort"],
              Time: contextResults["Time"],
            };
            return newContexts;
          });

          const ideaDoc = doc(db, "customers", user.uid, "ideas", selectedIdea);
          await updateDoc(ideaDoc, {
            ideas: products.map((p, i) =>
              i === index ? { ...p, ...contextResults } : p
            ),
          });
          await updateFirebaseWithTokens(
            contextResults,
            credits,
            setCredits,
            user
          );
        } catch (error) {
          console.error(error);
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
      const sanitizedTitle = sanitizeTitle(product.product);
      const filename = `${sanitizedTitle}.pdf`;

      const doc = new jsPDF();

      doc.setFontSize(22);
      doc.text(product.product, 10, 10);

      doc.setFontSize(16);

      const headers = ["Parameter", "Detail"];
      console.log(product);

      const data = [
        ["Product", product.product],
        ["Description", product.description],
        ["Potential Clients", product.potentialClients],
        ["Where to find the clients", product.whereToFindClients],
        ["Creating the product", product["Creating the product"]],
        ["Finding customers", product["Finding customers"]],
        ["Selling product", product["Selling product"]],
        ["Consumer Pain Point", product["Consumer Pain Point"]],
        ["Effort", product["Effort"]],
        ["Time", product["Time"]],
      ];

      autoTable(doc, {
        startY: 30,
        head: [headers],
        body: data,
        styles: { fillColor: [255, 255, 255], textColor: 20, fontSize: 10 },
        columnStyles: {
          0: { halign: "right", minCellWidth: 40 },
          1: { minCellWidth: 50 },
        },
      });

      doc.save(filename);
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
        startY: 30,
        head: headers,
        body: data,
        styles: { fillColor: [255, 255, 255], textColor: 20, fontSize: 10 },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 50 },
          2: { cellWidth: 50 },
          3: { cellWidth: 50 },
        },
      });

      doc.save(`${title}.pdf`);
    }
  }

  function renderHowToDialog(product, index) {
    if (
      product["Creating the product"].length > 0 &&
      product["Finding customers"].length > 0 &&
      product["Selling product"].length > 0
    ) {
      return <HowToDialog content={product}></HowToDialog>;
    } else if (startLoading[index]) {
      return <span>Loading...</span>;
    } else if (howToStart[index]) {
      return <HowToDialog content={howToStart[index]}></HowToDialog>;
    } else {
      return (
        <button
          onClick={() => handleStartButtonClick(product, index)}
          className="solid-card-button"
        >
          Find out how to start
        </button>
      );
    }
  }

  function renderContextDialog(product, index) {
    if (
      product["Consumer Pain Point"].length > 0 &&
      product["Effort"].length > 0 &&
      product["Time"].length > 0
    ) {
      return (
        <ContextDialog
          content={product}
          title={product["product"]}
        ></ContextDialog>
      );
    } else if (loading[index]) {
      return <span>Loading...</span>;
    } else if (ideaContexts[index]) {
      return (
        <ContextDialog
          content={ideaContexts[index]}
          title={product["product"]}
        ></ContextDialog>
      );
    } else {
      return (
        <button
          onClick={() => handleButtonClick(product, index)}
          className="solid-card-button"
        >
          Get Offering Optimization
        </button>
      );
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
        <tbody key={Math.random()}>
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
                        <div>{renderHowToDialog(product, index)}</div>
                        <div>{renderContextDialog(product, index)}</div>
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
