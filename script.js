async function fetchData() {
  try {
    const response = await axios.get("https://api.covid19api.com/summary");
    const globalData = response.data.Global;
    const countriesData = response.data.Countries;

    document.getElementById("totalConfirmed").innerText =
      globalData.TotalConfirmed.toLocaleString();
    document.getElementById("newDeaths").innerText =
      globalData.NewDeaths.toLocaleString();
    document.getElementById("totalRecovered").innerText =
      globalData.TotalRecovered.toLocaleString();

    createPieChart(globalData);
    createBarChart(countriesData);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

function createPieChart(data) {
  const ctx = document.getElementById("pieChart").getContext("2d");
  new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["New Confirmed", "New Deaths", "New Recovered"],
      datasets: [
        {
          data: [data.NewConfirmed, data.NewDeaths, data.NewRecovered],
          backgroundColor: [
            "rgba(75, 192, 192, 0.5)",
            "rgba(255, 99, 132, 0.5)",
            "rgba(255, 206, 86, 0.5)",
          ],
          borderColor: [
            "rgba(75, 192, 192, 1)",
            "rgba(255, 99, 132, 1)",
            "rgba(255, 206, 86, 1)",
          ],
          borderWidth: 1,
        },
      ],
    },
  });
}

function createBarChart(data) {
  const top10Countries = _.chain(data)
      .orderBy(['TotalDeaths'], ['desc'])
      .take(10)
      .value();

  const labels = top10Countries.map(country => country.Country);
  const totalDeaths = top10Countries.map(country => country.TotalDeaths);

  const ctx = document.getElementById('barChart').getContext('2d');
  new Chart(ctx, {
      type: 'bar',
      data: {
          labels: labels,
          datasets: [{
              label: 'Total Deaths',
              data: totalDeaths,
              backgroundColor: 'rgba(255, 99, 132, 0.5)',
              borderColor: 'rgba(255, 99, 132, 1)',
              borderWidth: 1
          }]
      },
      options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
              y: {
                  beginAtZero: true
              }
          },
          plugins: {
              legend: {
                  display: false
              },
              title: {
                  display: true,
                  text: 'Top 10 Countries by Total Deaths'
              }
          }
      }
  });
}


fetchData();
