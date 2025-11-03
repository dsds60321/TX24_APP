package kr.tx24.fc.repository;

import com.fasterxml.jackson.databind.JsonNode;
import kr.tx24.fc.bean.SearchBean;
import kr.tx24.fc.bean.SearchPage;
import kr.tx24.fc.enums.MockNames;
import kr.tx24.lib.lang.CommonUtils;
import kr.tx24.lib.map.SharedMap;
import kr.tx24.lib.mapper.JacksonUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Repository
public class DummyRepository {

	private static final Logger log = LoggerFactory.getLogger(DummyRepository.class);
	private static final Path MOCK_DATA_PATH = Path.of("mock", "mock-data.json");
	private static final long DEFAULT_ROWS_PER_PAGE = 20L;

	/**
	 * 더미 데이터 조회
	 */
	public static List<SharedMap<String, Object>> of(MockNames mockName, List<SearchBean> datas) {
		List<SharedMap<String, Object>> rows = loadMock(mockName.getKey());
		return rows.stream()
				.filter(row -> datas.stream().allMatch(data -> matches(row, data)))
				.collect(Collectors.toList());
	}

	/**
	 * 더미 데이터 페이징 조회
	 */
	public static List<SharedMap<String, Object>> of(MockNames mockName, List<SearchBean> datas, SearchPage page) {
		return search(loadMock(mockName.getKey()), datas, page);
	}


	/**
	 * 더미 데이터 조회
	 * @param key
	 * @return
	 */

	private static List<SharedMap<String, Object>> loadMock(String key) {
		if (!Files.exists(MOCK_DATA_PATH)) {
			log.warn("Mock data file not found: {}", MOCK_DATA_PATH.toAbsolutePath());
			return Collections.emptyList();
		}

		try {
			JsonNode root = new JacksonUtils().fromJson(MOCK_DATA_PATH, JsonNode.class);
			JsonNode rowsNode = root.path(key).path("rows");
			List<SharedMap<String, Object>> loadedRows = new ArrayList<>();
			rowsNode.forEach(node -> {
				SharedMap map = new JacksonUtils().fromJson(node.toString(), SharedMap.class);
				loadedRows.add(map);
			});
			return Collections.unmodifiableList(loadedRows);
		} catch (Exception e) {
			log.info("Mock Data 불러오기 실패 : {} ", CommonUtils.getExceptionMessage(e, 1000));
			return Collections.emptyList();
		}
	}

	/**
	 * 검색
	 */
	private static List<SharedMap<String, Object>> search(List<SharedMap<String, Object>> rows, List<SearchBean> datas, SearchPage page) {
		List<SharedMap<String, Object>> filtered = rows;
		if (datas != null && !datas.isEmpty()) {
			filtered = rows.stream()
				.filter(row -> datas.stream().allMatch(data -> matches(row, data)))
				.collect(Collectors.toList());
		}

		long rowsPerPage = page.rowsPerPage > 0 ? page.rowsPerPage : DEFAULT_ROWS_PER_PAGE;
		page.rowsPerPage = rowsPerPage;
		page.totalSize = filtered.size();

		long start = rowsPerPage * page.selectedPage;
		if (start >= filtered.size()) {
			start = Math.max(filtered.size() - rowsPerPage, 0);
			page.selectedPage = start / rowsPerPage;
		}

		return filtered.stream()
			.skip(start)
			.limit(rowsPerPage)
			.collect(Collectors.toList());
	}

	private static boolean matches(SharedMap<String, Object> row, SearchBean data) {
		if (row == null || data == null || CommonUtils.isEmpty(data.id)) {
			return false;
		}

		String operator = CommonUtils.isEmpty(data.oper) ? "eq" : data.oper.trim().toLowerCase();
		boolean isDateField = isDateField(data.id);

		if (!isDateField) {
			boolean equals = row.isEquals(data.id, data.value);
			if ("ne".equals(operator) || "neq".equals(operator) || "!=".equals(operator)) {
				return !equals;
			}
			return equals;
		}

		LocalDate actual = parseDate(row.get(data.id));
		LocalDate expected = parseDate(data.value);
		if (actual == null || expected == null) {
			boolean equals = row.isEquals(data.id, data.value);
			if ("ne".equals(operator) || "neq".equals(operator) || "!=".equals(operator)) {
				return !equals;
			}
			return equals;
		}

		switch (operator) {
			case "ge":
			case ">=":
				return !actual.isBefore(expected);
			case "gt":
			case ">":
				return actual.isAfter(expected);
			case "le":
			case "<=":
				return !actual.isAfter(expected);
			case "lt":
			case "<":
				return actual.isBefore(expected);
			case "ne":
			case "neq":
			case "!=":
				return !actual.isEqual(expected);
			default:
				return actual.isEqual(expected);
		}
	}

	private static boolean isDateField(String field) {
		return field != null && field.toLowerCase().contains("date");
	}

	private static LocalDate parseDate(Object value) {
		if (value == null) {
			return null;
		}
		if (value instanceof LocalDate) {
			return (LocalDate) value;
		}
		if (value instanceof Date) {
			return ((Date) value).toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
		}

		String text = value.toString().trim();
		if (text.isEmpty()) {
			return null;
		}

		try {
			return LocalDate.parse(text, DateTimeFormatter.BASIC_ISO_DATE);
		} catch (DateTimeParseException ignore) {
			try {
				return LocalDate.parse(text, DateTimeFormatter.ISO_LOCAL_DATE);
			} catch (DateTimeParseException ignored) {
				return null;
			}
		}
	}
}
