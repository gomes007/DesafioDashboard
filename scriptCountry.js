const covidApiUrl = "https://api.covid19api.com/";
const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");
const countrySelect = document.getElementById("countrySelect");
const dataTypeSelect = document.getElementById("dataType");
const applyFiltersButton = document.getElementById("applyFilters");
const chartCanvas = document.getElementById("chart");
let chart;

axios
  .get(`${covidApiUrl}countries`)
  .then((response) => {
    const countries = response.data;
    countries.sort((a, b) => a.Country.localeCompare(b.Country));
    countries.forEach((country) => {
      const option = document.createElement("option");
      option.value = country.Slug;
      option.textContent = country.Country;
      countrySelect.appendChild(option);
    });
  })
  .catch((error) => console.error(error));

applyFiltersButton.addEventListener("click", async () => {
  const startDate = startDateInput.value;
  const endDate = endDateInput.value;
  const country = countrySelect.value;
  const dataType = dataTypeSelect.value.toLowerCase();

  if (!startDate || !endDate || !country) {
    alert("Por favor, preencha todos os campos.");
    return;
  }

  try {
    // Obter os totais e os dados do gráfico em uma única requisição
    const [totalCasesResponse, chartDataResponse] = await Promise.all([
      axios.get(
        `${covidApiUrl}country/${country}?from=${startDate}T00:00:00Z&to=${endDate}T23:59:59Z`
      ),
      axios.get(
        `${covidApiUrl}total/country/${country}/status/${dataType}?from=${startDate}T00:00:00Z&to=${endDate}T23:59:59Z`
      ),
    ]);

    // Obter os totais dos casos
    const totalCasesData = totalCasesResponse.data;
    const initialValue = { confirmed: 0, deaths: 0, recovered: 0 };
    const totalCases = totalCasesData.reduce((accumulator, entry) => {
      accumulator.confirmed += entry.Confirmed;
      accumulator.deaths += entry.Deaths;
      accumulator.recovered += entry.Recovered;
      return accumulator;
    }, initialValue);

    // Atualizar os totais nos cards
    document.getElementById("confirmedTotal").textContent =
      totalCases.confirmed.toLocaleString();
    document.getElementById("deathsTotal").textContent =
      totalCases.deaths.toLocaleString();
    document.getElementById("recoveredTotal").textContent =
      totalCases.recovered.toLocaleString();

    // Processar os dados do gráfico
    const chartData = chartDataResponse.data.map((entry) => ({
      date: entry.Date.split("T")[0],
      cases: entry.Cases,
    }));
    const dailyData = chartData.map((entry, index, array) => {
      if (index === 0) {
        return { ...entry, cases: entry.cases };
      }
      const dailyCases = entry.cases - array[index - 1].cases;
      return { ...entry, cases: Math.max(0, dailyCases) };
    });
    const average = _.meanBy(dailyData, "cases");

    // Renderizar o gráfico
    if (chart) {
      chart.destroy();
    }
    chart = new Chart(chartCanvas, {
      type: "line",
      data: {
        labels: dailyData.map((entry) => entry.date),
        datasets: [
          {
            label: `${
              dataType.charAt(0).toUpperCase() + dataType.slice(1)
            } Cases`,
            data: dailyData.map((entry) => entry.cases),
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
          },
          {
            label: "Average",
            data: Array(dailyData.length).fill(average),
            borderColor: "rgba(255, 99, 132, 1)",
            borderWidth: 1,
            borderDash: [5, 5],
            fill: false,
            pointRadius: 0,
          },
        ],
      },
      options: {
        scales: {
          x: {
            type: "category",
            ticks: {
              autoSkip: true,
              maxTicksLimit: 20,
            },
          },
          y: {
            beginAtZero: true,
          },
        },
      },
    });
  } catch (error) {
    console.error(error);
  }
});
