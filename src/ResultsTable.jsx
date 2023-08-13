import React, { useEffect, useState } from "react";
import "./ResultsTable.css";
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
      console.log("Start Button clicked");

      // Check if the product already has the 'starting' information
      if (
        product["Creating the product"] &&
        product["Finding customers"] &&
        product["Selling product"]
      ) {
        console.log(
          `${product["Creating the product"]} ${product["Finding customers"]} ${product["Selling product"]}`
        );
      } else {
        setStartLoading((prevStartLoading) => ({
          ...prevStartLoading,
          [index]: true,
        }));

        try {
          const productString = Object.entries(product)
            .map(([key, value]) => `${key}: ${value}`)
            .join("\n");
          console.log("Before calling getStartingInfo");
          const response = await fetch(
            "https://europe-west3-home-page-authentication.cloudfunctions.net/getStartingInfo",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                productString: productString,
              }),
            }
          );
          console.log("After calling getStartingInfo");
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }

          const startResults = await response.json();

          // Update local state
          setProducts((prevStarts) => {
            const newStarts = [...prevStarts];
            newStarts[index] = {
              ...newStarts[index],
              "Creating the product": startResults["Creating the product"],
              "Finding customers": startResults["Finding customers"],
              "Selling product": startResults["Selling product"],
            };
            return newStarts;
          });

          const ideaDoc = doc(db, "customers", user.uid, "ideas", selectedIdea);
          await updateDoc(ideaDoc, {
            ideas: products.map((p, i) =>
              i === index ? { ...p, ...startResults } : p
            ),
          });

          // If necessary, handle updating Firebase tokens (like you commented out in handleButtonClick)
          /*await updateFirebaseWithTokens(
            startResults,
            credits,
            setCredits,
            user
          );*/
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
      console.log("Context Button clicked");
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
          const businessIdeaString = Object.entries(product)
            .map(([key, value]) => `${key}: ${value}`)
            .join("\n");
          const response = await fetch(
            "https://europe-west3-home-page-authentication.cloudfunctions.net/getContextInfo",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                businessIdeaString: businessIdeaString,
              }),
            }
          );
          console.log(`HTTP response status: ${response.status}`);
          console.log(response);
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }

          const contextResults = await response.json();

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
          /*await updateFirebaseWithTokens(
            contextResults,
            credits,
            setCredits,
            user
          );*/
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

      let currentY = 10; // starting Y position for elements

      // Add the logo to the PDF
      if (logoBase64) {
        doc.addImage(logoBase64, "PNG", 10, currentY, 40, 30);
        currentY += 35; // adjust this to increase the space between the logo and the title
      }

      doc.setFontSize(16);
      doc.text(product.product, 10, currentY);
      currentY += 20; // adjust this to increase the space between the title and table

      const headers = ["Heading", "Details"];

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
        startY: currentY,
        head: [headers],
        body: data,
        styles: { fillColor: [255, 255, 255], textColor: 20, fontSize: 10 },
        columnStyles: {
          0: { halign: "left", minCellWidth: 40 },
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

      let currentY = 10; // starting Y position for elements

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

      // Add the logo to the PDF
      if (logoBase64) {
        doc.addImage(logoBase64, "PNG", 10, currentY, 40, 30);
        currentY += 35; // adjust this to increase the space between the logo and the title
      }

      doc.setFontSize(16);
      const lines = doc.splitTextToSize(title, 180);
      doc.text(lines, 10, currentY);

      const lineHeight = 7; // Roughly the height for font size 22. Adjust if needed.
      const titleHeight = lines.length * lineHeight;
      currentY += titleHeight + 10; // Adding 10 as a gap between the title and table

      doc.setFontSize(16);

      autoTable(doc, {
        startY: currentY + titleHeight + 5, // Adding 10 as a gap between the title and table
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
          className="transparent-green-button"
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
          className="transparent-green-button"
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
