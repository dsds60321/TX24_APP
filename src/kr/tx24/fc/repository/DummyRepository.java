package kr.tx24.fc.repository;

import com.fasterxml.jackson.databind.JsonNode;
import kr.tx24.fc.bean.SearchBean;
import kr.tx24.fc.bean.SearchPage;
import kr.tx24.fc.enums.MockNames;
import kr.tx24.fc.enums.TxResultCode;
import kr.tx24.fc.exception.TxException;
import kr.tx24.lib.lang.CommonUtils;
import kr.tx24.lib.map.MapFactory;
import kr.tx24.lib.map.SharedMap;
import kr.tx24.lib.map.TypeRegistry;
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

/**
 * 더미 데이터 repository
 */
@Repository
public class DummyRepository {

	private static final Logger looger = LoggerFactory.getLogger(DummyRepository.class);

	private static final JacksonUtils jacksonUtils = new JacksonUtils();
	private static final Path MOCK_DATA_PATH = Path.of("mock", "mock-data.json");
	private static final long DEFAULT_ROWS_PER_PAGE = 20L;


	public static SharedMap<String, Object> of(MockNames mockName) {
		return loadMockOne(mockName.getKey());
	}

	public static <T> T of(MockNames mockName, TypeRegistry type) {
		return loadMockOne(mockName.getKey(), type);
	}

	public static List<SharedMap<String, Object>> list(MockNames mockName) {
		return loadMock(mockName.getKey());
	}

	/**
	 * 더미 데이터 조회
	 */
	public static List<SharedMap<String, Object>> of(MockNames mockName, List<SearchBean> datas) {
		List<SharedMap<String, Object>> rows = loadMock(mockName.getKey());

		// 검색
		rows = rows.stream()
				.filter(row -> datas.stream().allMatch(data -> matches(row, data)))
				.toList();


		for (int i = 0; i < rows.size(); i++) {
			rows.get(i).put("idx", i + 1);
		}

		return rows;
	}

	/**
	 * 더미 데이터 페이징 조회
	 */
	public static List<SharedMap<String, Object>> of(MockNames mockName, List<SearchBean> datas, SearchPage page) {
		List<SharedMap<String, Object>> rows = search(loadMock(mockName.getKey()), datas, page);

		for (int i = 0; i < rows.size(); i++) {
			rows.get(i).put("idx", i + 1);
		}

		return rows;
	}


	/**
	 * 더미 데이터 조회
	 * @param key
	 * @return
	 */

	private static List<SharedMap<String, Object>> loadMock(String key) {
		if (!Files.exists(MOCK_DATA_PATH)) {
			looger.warn("Mock data file not found: {}", MOCK_DATA_PATH.toAbsolutePath());
			return Collections.emptyList();
		}

		try {
			JsonNode root = jacksonUtils.fromJson(MOCK_DATA_PATH, JsonNode.class);
			JsonNode rowsNode = root.path(key).path("rows");
			List<SharedMap<String, Object>> loadedRows = new ArrayList<>();
			rowsNode.forEach(node -> {
				SharedMap map = jacksonUtils.fromJson(node.toString(), SharedMap.class);
				loadedRows.add(map);
			});
			return Collections.unmodifiableList(loadedRows);
		} catch (Exception e) {
			looger.info("Mock Data 불러오기 실패 : {} ", CommonUtils.getExceptionMessage(e, 1000));
			return Collections.emptyList();
		}
	}

	/**
	 * 더미 데이터 단건 조회
	 */
	private static SharedMap<String, Object> loadMockOne(String key) {
		SharedMap<String, Object> map = loadMockOne(key, TypeRegistry.MAP_SHAREDMAP_OBJECT);
		return new SharedMap<>(map);
	}


	private static <T> T loadMockOne(String key, TypeRegistry typeRegistry) {
		if (!Files.exists(MOCK_DATA_PATH)) {
			looger.warn("Mock data file not found: {}", MOCK_DATA_PATH.toAbsolutePath());
			throw new TxException(TxResultCode.NO_CONTENTS, "Mock 데이터 파일을 찾을 수 없습니다.");
		}

		try {
			JsonNode root = jacksonUtils.fromJson(MOCK_DATA_PATH, JsonNode.class);
			JsonNode targetNode = root.path(key);
			if (targetNode.isMissingNode() || targetNode.isNull() || targetNode.isEmpty()) {
				throw new TxException(TxResultCode.NO_CONTENTS, "요청한 Mock 데이터를 찾을 수 없습니다.");
			}

			T result = jacksonUtils.fromJson(targetNode.toString(), typeRegistry);
			if (result == null) {
				throw new TxException(TxResultCode.NO_CONTENTS, "Mock 데이터가 비어 있습니다.");
			}

			if (result instanceof SharedMap<?, ?> sharedMap && sharedMap.isEmpty()) {
				throw new TxException(TxResultCode.NO_CONTENTS, "Mock 데이터가 비어 있습니다.");
			}

			return result;
		} catch (TxException ex) {
			throw ex;
		} catch (Exception e) {
			looger.info("Mock Data 불러오기 실패 : {} ", CommonUtils.getExceptionMessage(e, 1000));
			throw new TxException(TxResultCode.INTERNAL_ERROR, "Mock 데이터 로딩 중 오류가 발생했습니다.", e);
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

		// 페이징 계산
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

	/**
	 * 검색
	 */
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
		return field != null && (field.toLowerCase().contains("date") || field.toLowerCase().contains("day"));
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
