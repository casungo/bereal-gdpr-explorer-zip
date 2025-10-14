function convertToCSV(data: Record<string, unknown>[]): string {
  if (!data || data.length === 0) {
    return "";
  }
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(",")];

  for (const row of data) {
    const values = headers.map((header) => {
      let cell =
        row[header] === null || row[header] === undefined
          ? ""
          : String(row[header]);
      if (typeof cell === "string") {
        cell = cell.replace(/"/g, '""');
        if (cell.includes(",")) {
          cell = `"${cell}"`;
        }
      }
      return cell;
    });
    csvRows.push(values.join(","));
  }

  return csvRows.join("\n");
}

export function exportToCsv(
  data: Record<string, unknown>[],
  filename: string
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
  }
}
