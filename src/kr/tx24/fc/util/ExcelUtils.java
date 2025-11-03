package kr.tx24.fc.util;

import kr.tx24.lib.lang.CommonUtils;
import kr.tx24.lib.lang.DateUtils;
import kr.tx24.lib.map.SharedMap;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;

public final class ExcelUtils {

	private static final Logger log = LoggerFactory.getLogger(ExcelUtils.class);
	private static final Path WEB_ROOT = FileUtils.getWebPath();
	private static final Path STORAGE_DIR = WEB_ROOT.resolve("download").resolve("excel");
	private static final String DOWNLOAD_PREFIX = "/download/excel/";

	private ExcelUtils() {
	}

	public static String createWorkbook(String fileName, Map<String, Object> headers, List<SharedMap<String, Object>> rows) {
		if (rows == null) {
			return null;
		}

		try {
			Files.createDirectories(STORAGE_DIR);

			String safeName = CommonUtils.isBlank(fileName, "excel") + "%s".formatted(DateUtils.getCurrentDate());
			Path target = STORAGE_DIR.resolve(safeName + ".xlsx");

			writeWorkbook(target, headers, rows);
			return DOWNLOAD_PREFIX + target.getFileName();
		} catch (IOException e) {
			log.warn("엑셀 파일 생성 실패: {}", CommonUtils.getExceptionMessage(e, 200));
			return null;
		}
	}

	private static void writeWorkbook(Path target, Map<String, Object> headers, List<SharedMap<String, Object>> rows) throws IOException {
		try (SXSSFWorkbook workbook = new SXSSFWorkbook(100);
			 OutputStream out = Files.newOutputStream(target)) {

			workbook.setCompressTempFiles(true);
			Sheet sheet = workbook.createSheet("Sheet1");

			List<String> headerKeys = new ArrayList<>();
			int rowIndex = 0;

			if (headers != null && !headers.isEmpty()) {
				Row headerRow = sheet.createRow(rowIndex++);
				int colIndex = 0;
				for (Map.Entry<String, Object> entry : headers.entrySet()) {
					headerKeys.add(entry.getKey());
					Cell cell = headerRow.createCell(colIndex++);
					cell.setCellValue(String.valueOf(entry.getValue()));
				}
			}

			for (SharedMap<String, Object> rowMap : rows) {
				Row dataRow = sheet.createRow(rowIndex++);
				if (!headerKeys.isEmpty()) {
					writeRowByKeys(dataRow, headerKeys, rowMap);
				} else {
					writeRowByEntries(dataRow, rowMap);
				}
			}

			workbook.write(out);
			workbook.dispose();
		}
	}

	private static void writeRowByKeys(Row row, List<String> headerKeys, SharedMap<String, Object> rowMap) {
		for (int i = 0; i < headerKeys.size(); i++) {
			Object value = rowMap.get(headerKeys.get(i));
			setCellValue(row.createCell(i), value);
		}
	}

	private static void writeRowByEntries(Row row, SharedMap<String, Object> rowMap) {
		LinkedHashMap<String, Object> ordered = new LinkedHashMap<>(rowMap);
		int col = 0;
		for (Object value : ordered.values()) {
			setCellValue(row.createCell(col++), value);
		}
	}

	private static void setCellValue(Cell cell, Object value) {
		if (Objects.isNull(value)) {
			cell.setCellValue("");
			return;
		}
		if (value instanceof Number) {
			cell.setCellValue(((Number) value).doubleValue());
			return;
		}
		if (value instanceof Boolean) {
			cell.setCellValue((Boolean) value);
			return;
		}
		cell.setCellValue(String.valueOf(value));
	}

	public static void main(String[] args) {
		Path path = Path.of("test", "abc");
		System.out.println(path.toString());

		Path hi = path.resolve("hi");
		System.out.println(hi.toString());
	}
}
