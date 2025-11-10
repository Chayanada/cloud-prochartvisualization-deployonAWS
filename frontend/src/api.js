const API_URL = import.meta.env.VITE_API_URL;

export async function uploadChartFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData,
    });

    if (!res.ok) {
        throw new Error('Upload failed');
    }

    return res.json(); // { labels, prices, highPrices, lowPrices }
}
