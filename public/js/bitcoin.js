const socket = io.connect('http://localhost:3000', {
  withCredentials: false,
  transports: ['websocket'],
});

const formatName = (name) => name.toUpperCase();
const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
socket.on('data', (data) => {
  const tbody = document.getElementById('tbody-exchange');
  if (Array.isArray(data)) {
    const trs = data.map(
      ({ name, slug, average_price_bitcoin }) => `
    <tr id="${slug}">
      <td>${formatName(name)}</td>
      <td>${formatCurrency(average_price_bitcoin)}</td>
    </tr>
    `,
    );
    tbody.innerHTML = trs.join('');
  }
});

socket.on('update', ({ name, slug, average_price_bitcoin }) => {
  const tbody = document.getElementById(slug);
  tbody.innerHTML = `
      <td>${formatName(name)}</td>
      <td>${formatCurrency(average_price_bitcoin)}</td>
  `;
});

socket.on('error', function (error) {
  console.log(error);
  console.log('error');
});
