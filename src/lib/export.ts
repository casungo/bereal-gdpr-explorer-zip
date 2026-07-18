function encodeCsvCell(value: unknown): string {
	let cell = value === null || value === undefined ? "" : String(value);
	if (/^\s*[=+\-@]/.test(cell)) {
		cell = `'${cell}`;
	}
	return `"${cell.replace(/"/g, '""')}"`;
}

export function convertToCSV(data: Record<string, unknown>[]): string {
	if (!data || data.length === 0) {
		return "";
	}
	const headers = Object.keys(data[0]);
	const csvRows = [headers.map(encodeCsvCell).join(",")];

	for (const row of data) {
		const values = headers.map((header) => encodeCsvCell(row[header]));
		csvRows.push(values.join(","));
	}

	return csvRows.join("\r\n");
}

export function exportToCsv(
	data: Record<string, unknown>[],
	filename: string,
): void {
	const csvString = convertToCSV(data);
	const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
	const link = document.createElement("a");
	if (link.download !== undefined) {
		const url = URL.createObjectURL(blob);
		link.setAttribute("href", url);
		link.setAttribute("download", filename);
		link.style.visibility = "hidden";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		setTimeout(() => URL.revokeObjectURL(url), 0);
	}
}
