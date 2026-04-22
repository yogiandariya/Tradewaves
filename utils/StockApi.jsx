import axios from "axios";

const API_KEY = "8TT1NWEGC8T0KMD2";
const BASE_URL = "https://www.alphavantage.co/query";

export const fetchStockPrice = async (symbol) => {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        function: "GLOBAL_QUOTE",
        symbol,
        apikey: API_KEY
      }
    });
    return parseFloat(response.data["Global Quote"]["05. price"]);
  } catch (error) {
    console.error("Error fetching stock price:", error);
    return null;
  }
};
