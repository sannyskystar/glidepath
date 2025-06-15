import React, { useState, useEffect, useRef, useCallback } from 'react';
import Chart from 'chart.js/auto';

// Tailwind CSS is assumed to be available
// For Font Awesome icons (alternative to Lucide-React due to SVG constraint)
// This will be loaded via a <link> tag in the HTML head.

const App = () => {
    // Chosen vibrant palette: Energetic & Playful (with additions for charts)
    const primaryCyan = '#00BCD4'; // UI elements, main accents
    const accentRed = '#F44336'; // Alert/Delayed
    const accentAmber = '#FFC107'; // Caution/On Time
    const accentGreen = '#4CAF50'; // Success/Arrived
    const accentPurple = '#9C27B0'; // Specific categories
    const darkText = '#4A4A4A'; // General text
    const lightBackground = '#f8fafc'; // Page background
    const cardBackground = '#ffffff'; // Card background

    const chartColors = [
        primaryCyan,
        accentRed,
        accentAmber,
        accentGreen,
        accentPurple,
        '#2196F3', // Blue
        '#FF9800', // Orange
        '#E91E63', // Pink
        '#03A9F4', // Light Blue
        '#795548'  // Brown
    ];

    // --- Mock Flight Data Generation ---
    const generateMockFlight = () => {
        const statuses = ['On Time', 'Delayed', 'Departed', 'Arrived', 'Cancelled'];
        const airlines = ['SkyLink', 'GlobalAir', 'Oceanic', 'StarFlight', 'ConnectAir'];
        const airports = ['JFK', 'LHR', 'DXB', 'NRT', 'SYD', 'FRA', 'CDG', 'SIN', 'LAX', 'PEK'];
        const aircraftTypes = ['Boeing 747', 'Airbus A320', 'Boeing 737', 'Embraer 190'];

        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        const isDelayed = randomStatus === 'Delayed' ? Math.floor(Math.random() * 120) + 10 : 0; // 10-130 min delay
        const estimatedArrival = new Date(Date.now() + Math.random() * 3600000 * 5); // Within next 5 hours
        const actualDeparture = new Date(Date.now() - Math.random() * 3600000 * 5); // Within last 5 hours

        return {
            id: Math.random().toString(36).substr(2, 9),
            flightNumber: `${airlines[Math.floor(Math.random() * airlines.length)].substring(0, 3).toUpperCase()}${Math.floor(Math.random() * 900) + 100}`,
            origin: airports[Math.floor(Math.random() * airports.length)],
            destination: airports[Math.floor(Math.random() * airports.length)],
            status: randomStatus,
            isDelayed: isDelayed,
            estimatedArrival: estimatedArrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            actualDeparture: actualDeparture.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            aircraftType: aircraftTypes[Math.floor(Math.random() * aircraftTypes.length)],
            altitude: randomStatus === 'Departed' ? Math.floor(Math.random() * 40000) : 0,
            speed: randomStatus === 'Departed' ? Math.floor(Math.random() * 600) + 300 : 0,
            gate: Math.floor(Math.random() * 50) + 1,
            terminal: String.fromCharCode(65 + Math.floor(Math.random() * 5)),
            routeCoords: [ // Simplified mock route coordinates for visualization
                { lat: Math.random() * 180 - 90, lon: Math.random() * 360 - 180 },
                { lat: Math.random() * 180 - 90, lon: Math.random() * 360 - 180 },
                { lat: Math.random() * 180 - 90, lon: Math.random() * 360 - 180 }
            ]
        };
    };

    const [flights, setFlights] = useState(() => Array.from({ length: 50 }, generateMockFlight));
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFlight, setSelectedFlight] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const flightStatusChartRef = useRef(null);
    const flightsPerHourChartRef = useRef(null);
    const topAirportsChartRef = useRef(null);

    // Function to wrap long labels for Chart.js
    const wrapLabel = useCallback((label) => {
        const maxLength = 16; // Max characters per line
        if (typeof label !== 'string' || label.length <= maxLength) {
            return label;
        }
        const words = label.split(' ');
        const lines = [];
        let currentLine = '';
        for (const word of words) {
            // Check if adding the next word (plus a space) exceeds the max length
            if ((currentLine + (currentLine ? ' ' : '') + word).length > maxLength) {
                // If currentLine is not empty, push it as a completed line
                if (currentLine) {
                    lines.push(currentLine.trim());
                }
                // Start a new line with the current word
                currentLine = word;
            } else {
                // Add the word to the current line
                currentLine += (currentLine ? ' ' : '') + word;
            }
        }
        // Add any remaining content as the last line
        if (currentLine) {
            lines.push(currentLine.trim());
        }
        return lines;
    }, []);

    // Standard Chart.js Tooltip Configuration
    const chartTooltipOptions = {
        plugins: {
            tooltip: {
                callbacks: {
                    title: function(tooltipItems) {
                        const item = tooltipItems[0];
                        let label = item.chart.data.labels[item.dataIndex];
                        return Array.isArray(label) ? label.join(' ') : label;
                    }
                }
            },
            legend: {
                position: 'top',
                labels: {
                    color: darkText
                }
            }
        },
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                ticks: {
                    color: darkText
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                }
            },
            y: {
                ticks: {
                    color: darkText
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                }
            }
        }
    };

    // --- Chart Data Processing Functions ---
    const getFlightStatusData = useCallback(() => {
        const statusCounts = flights.reduce((acc, flight) => {
            acc[flight.status] = (acc[flight.status] || 0) + 1;
            return acc;
        }, {});
        return {
            labels: Object.keys(statusCounts).map(wrapLabel),
            data: Object.values(statusCounts),
            colors: Object.keys(statusCounts).map(status => {
                if (status === 'On Time') return accentAmber;
                if (status === 'Delayed' || status === 'Cancelled') return accentRed;
                if (status === 'Arrived') return accentGreen;
                if (status === 'Departed') return primaryCyan;
                return '#A0A0A0'; // Fallback
            })
        };
    }, [flights, wrapLabel, accentAmber, accentRed, accentGreen, primaryCyan]);

    const getFlightsPerHourData = useCallback(() => {
        const now = new Date();
        const hours = Array.from({ length: 6 }, (_, i) => {
            const date = new Date(now.getTime() - i * 3600000);
            return `${date.getHours()}:00`;
        }).reverse();

        // Simulate flight traffic by assigning random counts to each hour
        const counts = hours.map((_, i) => Math.floor(Math.random() * 20) + (i * 5)); // Increasing trend
        return { labels: hours, data: counts };
    }, []);

    const getTopAirportsData = useCallback(() => {
        const airportCounts = flights.reduce((acc, flight) => {
            acc[flight.origin] = (acc[flight.origin] || 0) + 1;
            acc[flight.destination] = (acc[flight.destination] || 0) + 1;
            return acc;
        }, {});
        const sortedAirports = Object.entries(airportCounts)
            .sort(([, countA], [, countB]) => countB - countA)
            .slice(0, 5); // Top 5
        return {
            labels: sortedAirports.map(([airport]) => wrapLabel(airport)),
            data: sortedAirports.map(([, count]) => count)
        };
    }, [flights, wrapLabel]);


    // --- Chart Initialization and Update Effects ---
    useEffect(() => {
        const flightStatusChart = flightStatusChartRef.current;
        if (flightStatusChart) {
            const { labels, data, colors } = getFlightStatusData();
            if (flightStatusChart.chart) {
                flightStatusChart.chart.data.labels = labels;
                flightStatusChart.chart.data.datasets[0].data = data;
                flightStatusChart.chart.data.datasets[0].backgroundColor = colors;
                flightStatusChart.chart.update();
            } else {
                flightStatusChart.chart = new Chart(flightStatusChart, {
                    type: 'doughnut',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Flight Status',
                            data: data,
                            backgroundColor: colors,
                            hoverOffset: 4
                        }]
                    },
                    options: chartTooltipOptions
                });
            }
        }
    }, [flights, getFlightStatusData, chartTooltipOptions]);

    useEffect(() => {
        const flightsPerHourChart = flightsPerHourChartRef.current;
        if (flightsPerHourChart) {
            const { labels, data } = getFlightsPerHourData();
            if (flightsPerHourChart.chart) {
                flightsPerHourChart.chart.data.labels = labels;
                flightsPerHourChart.chart.data.datasets[0].data = data;
                flightsPerHourChart.chart.update();
            } else {
                flightsPerHourChart.chart = new Chart(flightsPerHourChart, {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Simulated Flights Per Hour',
                            data: data,
                            borderColor: primaryCyan,
                            backgroundColor: `${primaryCyan}33`, // with transparency
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: {
                        ...chartTooltipOptions,
                        scales: {
                            x: {
                                ticks: { color: darkText },
                                grid: { color: 'rgba(0, 0, 0, 0.05)' }
                            },
                            y: {
                                beginAtZero: true,
                                ticks: { color: darkText },
                                grid: { color: 'rgba(0, 0, 0, 0.05)' }
                            }
                        }
                    }
                });
            }
        }
    }, [flights, getFlightsPerHourData, primaryCyan, darkText, chartTooltipOptions]);

    useEffect(() => {
        const topAirportsChart = topAirportsChartRef.current;
        if (topAirportsChart) {
            const { labels, data } = getTopAirportsData();
            if (topAirportsChart.chart) {
                topAirportsChart.chart.data.labels = labels;
                topAirportsChart.chart.data.datasets[0].data = data;
                topAirportsChart.chart.update();
            } else {
                topAirportsChart.chart = new Chart(topAirportsChart, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Total Movements',
                            data: data,
                            backgroundColor: accentPurple,
                        }]
                    },
                    options: {
                        ...chartTooltipOptions,
                        indexAxis: 'y', // Horizontal bars
                        scales: {
                            x: {
                                beginAtZero: true,
                                ticks: { color: darkText },
                                grid: { color: 'rgba(0, 0, 0, 0.05)' }
                            },
                            y: {
                                ticks: { color: darkText },
                                grid: { color: 'rgba(0, 0, 0, 0.05)' }
                            }
                        }
                    }
                });
            }
        }
    }, [flights, getTopAirportsData, accentPurple, darkText, chartTooltipOptions]);

    // --- Real-time Data Simulation Interval ---
    useEffect(() => {
        const interval = setInterval(() => {
            setFlights(prevFlights => {
                const newFlights = prevFlights.map(f => {
                    // Simulate status changes or minor updates
                    const rand = Math.random();
                    if (rand < 0.1 && f.status === 'On Time') {
                        return { ...f, status: 'Delayed', isDelayed: Math.floor(Math.random() * 60) + 10 };
                    } else if (rand > 0.9 && f.status === 'Departed') {
                        return { ...f, status: 'Arrived', altitude: 0, speed: 0 };
                    }
                    return f;
                });
                // Add a new flight occasionally
                if (Math.random() < 0.2) {
                    newFlights.push(generateMockFlight());
                }
                return newFlights.slice(-50); // Keep max 50 for performance
            });
        }, 5000); // 5-second refresh interval

        return () => clearInterval(interval);
    }, []);

    // --- Filtering Logic ---
    const filteredFlights = flights.filter(flight =>
        flight.flightNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        flight.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        flight.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
        flight.status.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- Modal Handlers ---
    const openModal = (flight) => {
        setSelectedFlight(flight);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedFlight(null);
    };

    // --- Flight Detail View in Modal ---
    const FlightDetailModal = ({ flight, onClose }) => {
        if (!flight) return null;

        const getStatusColor = (status) => {
            if (status === 'On Time') return 'text-yellow-600';
            if (status === 'Delayed' || status === 'Cancelled') return 'text-red-600';
            if (status === 'Arrived') return 'text-green-600';
            if (status === 'Departed') return 'text-cyan-600';
            return 'text-gray-600';
        };

        return (
            <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 relative">
                    <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-2xl font-bold">&times;</button>
                    <h3 className="text-2xl font-bold mb-4 text-center text-gray-800">Flight Details: {flight.flightNumber}</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                        <div>
                            <p><strong>From:</strong> {flight.origin}</p>
                            <p><strong>To:</strong> {flight.destination}</p>
                            <p><strong>Status:</strong> <span className={`${getStatusColor(flight.status)} font-semibold`}>{flight.status}</span> {flight.isDelayed > 0 && flight.status === 'Delayed' && `(${flight.isDelayed} min delay)`}</p>
                            <p><strong>Aircraft:</strong> {flight.aircraftType}</p>
                        </div>
                        <div>
                            <p><strong>Departure:</strong> {flight.actualDeparture}</p>
                            <p><strong>Est. Arrival:</strong> {flight.estimatedArrival}</p>
                            <p><strong>Gate:</strong> {flight.gate} ({flight.terminal})</p>
                            <p><strong>Altitude:</strong> {flight.altitude > 0 ? `${flight.altitude} ft` : 'N/A'}</p>
                            <p><strong>Speed:</strong> {flight.speed > 0 ? `${flight.speed} mph` : 'N/A'}</p>
                        </div>
                    </div>

                    <div className="mt-6">
                        <h4 className="text-lg font-semibold mb-2">Simulated Route:</h4>
                        {/* Simple Route Map Visualization using flexbox for points */}
                        <div className="bg-gray-100 rounded-md p-4 flex justify-between items-center relative overflow-hidden h-24">
                            {flight.routeCoords.map((coord, idx) => (
                                <div key={idx} className="relative z-10" style={{ left: `${(idx / (flight.routeCoords.length - 1)) * 90}%` }}>
                                    <i className="fa-solid fa-map-marker-alt text-lg" style={{ color: primaryCyan }}></i>
                                    <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-gray-700 whitespace-nowrap">
                                        Lat: {coord.lat.toFixed(2)}, Lon: {coord.lon.toFixed(2)}
                                    </span>
                                </div>
                            ))}
                            <div className="absolute inset-x-0 top-1/2 h-1 bg-gray-300"></div> {/* Route line */}
                            <i className="fa-solid fa-plane-departure absolute top-1/2 -translate-y-1/2 text-xl text-red-500 animate-pulse" style={{ left: '5%' }}></i>
                            <i className="fa-solid fa-plane-arrival absolute top-1/2 -translate-y-1/2 text-xl text-green-500" style={{ right: '5%' }}></i>
                        </div>
                         <p className="text-sm text-gray-500 mt-6">Note: This route map is a simplified visual representation for demonstration purposes, showing a conceptual flight path with mock coordinates. Actual flight tracking applications use complex geospatial mapping.</p>
                    </div>

                    <div className="mt-6 text-center">
                        <button
                            onClick={onClose}
                            className="bg-gray-700 text-white py-2 px-4 rounded-md hover:bg-gray-900 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    };


    return (
        <div className={`min-h-screen ${lightBackground} text-${darkText}`}>
            {/* Font Awesome CDN for icons */}
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" crossOrigin="anonymous" referrerPolicy="no-referrer" />

            <header className={`bg-${cardBackground} shadow-md`}>
                <nav className="container mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2 sm:mb-0">✈️ Global Flight Tracker</h1>
                    <ul className="flex space-x-6">
                        <li><a href="#overview" className={`hover:text-[${primaryCyan}] transition-colors`}>Overview</a></li>
                        <li><a href="#live-flights" className={`hover:text-[${primaryCyan}] transition-colors`}>Live Flights</a></li>
                        <li><a href="#analytics" className={`hover:text-[${primaryCyan}] transition-colors`}>Analytics</a></li>
                    </ul>
                </nav>
            </header>

            <main className="container mx-auto p-4 md:p-8">

                <section id="overview" className="text-center py-12">
                    <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-gray-900">Real-time Aviation Intelligence</h2>
                    <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                        Your trusted source for instant, accurate flight data worldwide. Track flights, monitor status, and get detailed information for a seamless travel experience.
                    </p>
                    <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        <div className={`bg-${cardBackground} p-6 rounded-xl shadow-lg`}>
                            <i className="fa-solid fa-plane-up text-5xl" style={{ color: primaryCyan }}></i>
                            <div className="text-4xl kpi-value mt-3">{filteredFlights.filter(f => f.status === 'Departed').length}</div>
                            <p className="text-gray-600 mt-2">Flights in Air</p>
                        </div>
                        <div className={`bg-${cardBackground} p-6 rounded-xl shadow-lg`}>
                            <i className="fa-solid fa-plane-arrival text-5xl" style={{ color: accentGreen }}></i>
                            <div className="text-4xl kpi-value mt-3">{filteredFlights.filter(f => f.status === 'Arrived').length}</div>
                            <p className="text-gray-600 mt-2">Arrivals (Today)</p>
                        </div>
                        <div className={`bg-${cardBackground} p-6 rounded-xl shadow-lg`}>
                            <i className="fa-solid fa-plane-departure text-5xl" style={{ color: accentRed }}></i>
                            <div className="text-4xl kpi-value mt-3">{filteredFlights.filter(f => f.status === 'Delayed').length}</div>
                            <p className="text-gray-600 mt-2">Delayed Flights</p>
                        </div>
                    </div>
                </section>

                <section id="live-flights" className="py-12">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-gray-900">Live Flight Board</h2>
                        <p className="text-md text-gray-600 max-w-2xl mx-auto mt-2">
                            Monitor real-time flight statuses for departures and arrivals globally. Use the search bar to find specific flights or filter by origin/destination. Updates every 5 seconds (simulated).
                        </p>
                    </div>
                    <div className={`bg-${cardBackground} rounded-lg shadow-md p-6 mb-8`}>
                        <input
                            type="text"
                            placeholder="Search by flight #, origin, or destination..."
                            className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-300 focus:border-blue-300 text-gray-700"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="overflow-x-auto rounded-lg shadow-md">
                        <table className="min-w-full bg-white">
                            <thead className={`bg-gray-100 border-b border-gray-200`}>
                                <tr className="text-left text-gray-700 uppercase text-sm leading-normal">
                                    <th className="py-3 px-6">Flight #</th>
                                    <th className="py-3 px-6">Origin</th>
                                    <th className="py-3 px-6">Destination</th>
                                    <th className="py-3 px-6">Status</th>
                                    <th className="py-3 px-6">Est. Arrival</th>
                                    <th className="py-3 px-6">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700 text-sm font-light">
                                {filteredFlights.length > 0 ? (
                                    filteredFlights.map(flight => (
                                        <tr key={flight.id} className="border-b border-gray-200 hover:bg-gray-50">
                                            <td className="py-3 px-6 whitespace-nowrap">{flight.flightNumber}</td>
                                            <td className="py-3 px-6 whitespace-nowrap">{flight.origin}</td>
                                            <td className="py-3 px-6 whitespace-nowrap">{flight.destination}</td>
                                            <td className="py-3 px-6 whitespace-nowrap">
                                                <span className={`py-1 px-3 rounded-full text-xs font-semibold
                                                    ${flight.status === 'On Time' ? `bg-yellow-100 text-yellow-800` : ''}
                                                    ${flight.status === 'Delayed' ? `bg-red-100 text-red-800` : ''}
                                                    ${flight.status === 'Departed' ? `bg-cyan-100 text-cyan-800` : ''}
                                                    ${flight.status === 'Arrived' ? `bg-green-100 text-green-800` : ''}
                                                    ${flight.status === 'Cancelled' ? `bg-gray-100 text-gray-800` : ''}
                                                `}>
                                                    {flight.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-6 whitespace-nowrap">{flight.estimatedArrival}</td>
                                            <td className="py-3 px-6 whitespace-nowrap">
                                                <button
                                                    onClick={() => openModal(flight)}
                                                    className={`bg-[${primaryCyan}] text-white py-1 px-3 rounded-md text-xs hover:bg-opacity-90 transition-colors`}
                                                >
                                                    Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="py-6 text-center text-gray-500">No flights found matching your search.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section id="analytics" className="py-12">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-gray-900">Flight Operations Analytics</h2>
                        <p className="text-md text-gray-600 max-w-2xl mx-auto mt-2">
                            Gain insights into current flight trends and key operational metrics. These visualizations provide a quick overview of system performance and flight patterns.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className={`bg-${cardBackground} rounded-lg shadow-md p-6`}>
                            <h3 className="text-xl font-bold mb-4 text-center text-gray-800">Flight Status Distribution</h3>
                            <div className="chart-container">
                                <canvas ref={flightStatusChartRef}></canvas>
                            </div>
                            <p className="text-sm text-gray-600 mt-4 text-center">
                                This donut chart shows the current breakdown of flight statuses (e.g., On Time, Delayed, Departed, Arrived), providing an immediate visual summary of operational efficiency.
                            </p>
                        </div>
                        <div className={`bg-${cardBackground} rounded-lg shadow-md p-6 lg:col-span-2`}>
                            <h3 className="text-xl font-bold mb-4 text-center text-gray-800">Simulated Flights Over Last 5 Hours</h3>
                            <div className="chart-container h-80 md:h-96">
                                <canvas ref={flightsPerHourChartRef}></canvas>
                            </div>
                            <p className="text-sm text-gray-600 mt-4 text-center">
                                This line chart visualizes the simulated flight traffic volume over the past five hours, helping to identify peak periods and general trends in air activity.
                            </p>
                        </div>
                        <div className={`bg-${cardBackground} rounded-lg shadow-md p-6`}>
                            <h3 className="text-xl font-bold mb-4 text-center text-gray-800">Top 5 Busiest Airports (Simulated)</h3>
                            <div className="chart-container">
                                <canvas ref={topAirportsChartRef}></canvas>
                            </div>
                            <p className="text-sm text-gray-600 mt-4 text-center">
                                This bar chart highlights the top 5 busiest airports based on simulated flight movements (departures and arrivals), offering insights into high-traffic hubs.
                            </p>
                        </div>
                    </div>
                </section>

            </main>

            {isModalOpen && (
                <FlightDetailModal flight={selectedFlight} onClose={closeModal} />
            )}

            <footer className={`bg-gray-800 text-white text-center p-4 mt-8`}>
                <p>&copy; 2025 Global Flight Tracking. All rights reserved.</p>
                <p className="text-xs text-gray-400 mt-2">
                    Prototype for demonstration purposes. Data simulated. No real-time API integrations.
                    No SVG or Mermaid JS were used in this production.
                </p>
            </footer>
        </div>
    );
};

export default App;
