package kr.tx24.fc.repository.base;

import kr.tx24.fc.util.SqlSafeUtil;
import kr.tx24.lib.db.DBUtils;
import kr.tx24.lib.db.Retrieve;
import kr.tx24.lib.lang.CommonUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * 공통 레포지토리
 * SQLInjection 검증
 * Retrieve 반복 로직
 */
@Repository
public abstract class BaseRepository {

	private static final Logger logger = LoggerFactory.getLogger(BaseRepository.class);

	private volatile String table;

	protected BaseRepository() {
		this.table = init();
		if (CommonUtils.isEmpty(this.table)) {
			throw new IllegalStateException("BaseRepository.init() must return a table name");
		}
	}

	protected abstract String init();

	protected String getTable() {
		return table;
	}

	protected Retrieve getRetrieve() {
		return new Retrieve(this.table);
	}

	protected void setTable(String table) {
		if (CommonUtils.isEmpty(table)) {
			logger.warn("BaseRepository.setTable ignored blank table value");
			return;
		}

		String previous = this.table;
		if (Objects.equals(previous, table)) {
			return;
		}

		this.table = table;
		logger.info("BaseRepository.setTable : {} -> {}", previous, table);
	}


	/**
	 * 컬럼, 조건 + 연산자
	 */
	protected Retrieve findBy(String columns, List<Condition> structuredConditions) {
		return findBy(columns, structuredConditions, null, null);
	}

	/**
	 * 컬럼 + 조건
	 */
	protected Retrieve findBy(Map<String, Object>  conditions) {
		return buildRetrieve(null, null, conditions, null);
	}

	private Retrieve findBy(String columns, List<Condition> structuredConditions, Map<String, Object> equalsConditions, List<String> groupBy) {
		return buildRetrieve(columns, structuredConditions, equalsConditions, groupBy);
	}

	private Retrieve buildRetrieve(String columns,
			Collection<Condition> conditionBean,
			Map<String, Object> equalsConditions,
			Collection<String> groupBy) {

		Retrieve retrieve = new Retrieve(this.table);

		columns = CommonUtils.isEmpty(columns) ? "*" : columns;
		retrieve.column(columns);

		if (CommonUtils.isNotEmpty(conditionBean)) {
			conditionBean.stream()
				.filter(Objects::nonNull)
				.forEach(condition -> condition.apply(retrieve));
		}

		if (CommonUtils.isNotEmpty(equalsConditions)) {
			equalsConditions.forEach(retrieve::where);
		}

		if (CommonUtils.isNotEmpty(groupBy)) {
			groupBy.forEach(retrieve::groupBy);
		}

		return retrieve;
	}

	public static final class Condition {
		private final String column;
		private final Object value;
		private final String operator;

		public static Condition of(String column, Object value) {
			return of(column, value, DBUtils.eq);
		}

		public static Condition of(String column, Object value, String operator) {
			validate(column, value, operator);
			return new Condition(column, value, operator);
		}

		private Condition(String column, Object value) {
			this.column = column;
			this.value = value;
			this.operator = DBUtils.eq;
		}

		private Condition(String column, Object value, String operator) {
			this.column = column;
			this.value = value;
			this.operator = operator;
		}

		private void apply(Retrieve retrieve) {
			if (CommonUtils.isEmpty(retrieve)) {
				return;
			}

			if (CommonUtils.isEmpty(column) || CommonUtils.isEmpty(value)) {
				return;
			}

			retrieve.where(column, value, operator);
		}

		private static void validate(String column, Object value, String operator) {
			if (!SqlSafeUtil.isSafe(column)) {
				throw new IllegalArgumentException("Unsafe column value detected");
			}

			if (!SqlSafeUtil.isSafe(operator)) {
				throw new IllegalArgumentException("Unsafe operator value detected");
			}

			if (!SqlSafeUtil.isSafe(value)) {
				throw new IllegalArgumentException("Unsafe condition value detected");
			}
		}
	}
}
