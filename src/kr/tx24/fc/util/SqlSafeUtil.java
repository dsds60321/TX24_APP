package kr.tx24.fc.util;


import java.lang.reflect.Array;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import kr.tx24.lib.lang.CommonUtils;

/**
 * @author juseop
 *
 */
public class SqlSafeUtil {



	private static final String SQL_TYPES =
		"TABLE, TABLESPACE, PROCEDURE, FUNCTION, TRIGGER, KEY, VIEW, MATERIALIZED VIEW, LIBRARY" +
		"DATABASE LINK, DBLINK, INDEX, CONSTRAINT, TRIGGER, USER, SCHEMA, DATABASE, PLUGGABLE DATABASE, BUCKET, " +
		"CLUSTER, COMMENT, SYNONYM, TYPE, JAVA, SESSION, ROLE, PACKAGE, PACKAGE BODY, OPERATOR" +
		"SEQUENCE, RESTORE POINT, PFILE, CLASS, CURSOR, OBJECT, RULE, USER, DATASET, DATASTORE, " +
		"COLUMN, FIELD, OPERATOR";
	
	private static final String[] SQL_REGEXPS = {
		"(?i)(.*)(\\b)+(OR|AND)(\\s)+(true|false)(\\s)*(.*)",
		"(?i)(.*)(\\b)+(OR|AND)(\\s)+(\\w)(\\s)*(\\=)(\\s)*(\\w)(\\s)*(.*)",
		"(?i)(.*)(\\b)+(OR|AND)(\\s)+(equals|not equals)(\\s)+(true|false)(\\s)*(.*)",
		"(?i)(.*)(\\b)+(OR|AND)(\\s)+([0-9A-Za-z_'][0-9A-Za-z\\d_']*)(\\s)*(\\=)(\\s)*([0-9A-Za-z_'][0-9A-Za-z\\d_']*)(\\s)*(.*)",
		"(?i)(.*)(\\b)+(OR|AND)(\\s)+([0-9A-Za-z_'][0-9A-Za-z\\d_']*)(\\s)*(\\!\\=)(\\s)*([0-9A-Za-z_'][0-9A-Za-z\\d_']*)(\\s)*(.*)",
		"(?i)(.*)(\\b)+(OR|AND)(\\s)+([0-9A-Za-z_'][0-9A-Za-z\\d_']*)(\\s)*(\\<\\>)(\\s)*([0-9A-Za-z_'][0-9A-Za-z\\d_']*)(\\s)*(.*)",
		"(?i)(.*)(\\b)+SELECT(\\b)+\\s.*(\\b)(.*)",
		"(?i)(.*)(\\b)+INSERT(\\b)+\\s.*(\\b)+INTO(\\b)+\\s.*(.*)",
		"(?i)(.*)(\\b)+UPDATE(\\b)+\\s.*(.*)",
		"(?i)(.*)(\\b)+DELETE(\\b)+\\s.*(\\b)+FROM(\\b)+\\s.*(.*)",
		"(?i)(.*)(\\b)+UPSERT(\\b)+\\s.*(.*)",
		"(?i)(.*)(\\b)+SAVEPOINT(\\b)+\\s.*(.*)",
		"(?i)(.*)(\\b)+CALL(\\b)+\\s.*(.*)",
		"(?i)(.*)(\\b)+ROLLBACK(\\b)+\\s.*(.*)",
		"(?i)(.*)(\\b)+KILL(\\b)+\\s.*(.*)",
		"(?i)(.*)(\\b)+DROP(\\b)+\\s.*(.*)",
		"(?i)(.*)(\\b)+CREATE(\\b)+(\\s)*(" + SQL_TYPES.replaceAll(",", "|") + ")(\\b)+\\s.*(.*)",
		"(?i)(.*)(\\b)+ALTER(\\b)+(\\s)*(" + SQL_TYPES.replaceAll(",", "|") + ")(\\b)+\\s.*(.*)",
		"(?i)(.*)(\\b)+TRUNCATE(\\b)+(\\s)*(" + SQL_TYPES.replaceAll(",", "|") + ")(\\b)+\\s.*(.*)",
		"(?i)(.*)(\\b)+LOCK(\\b)+(\\s)*(" + SQL_TYPES.replaceAll(",", "|") + ")(\\b)+\\s.*(.*)",
		"(?i)(.*)(\\b)+UNLOCK(\\b)+(\\s)*(" + SQL_TYPES.replaceAll(",", "|") + ")(\\b)+\\s.*(.*)",
		"(?i)(.*)(\\b)+RELEASE(\\b)+(\\s)*(" + SQL_TYPES.replaceAll(",", "|") + ")(\\b)+\\s.*(.*)",
		"(?i)(.*)(\\b)+DESC(\\b)+(\\w)*\\s.*(.*)",
		"(?i)(.*)(\\b)+DESCRIBE(\\b)+(\\w)*\\s.*(.*)",
		"(.*)(/\\*|\\*/|;){1,}(.*)",
		"(.*)(-){2,}(.*)",
	
	};
	
	
	// pre-build the Pattern objects for faster validation
	// private static final List<Pattern> validationPatterns = buildValidationPatterns();
	private static final List<Pattern> validationPatterns = buildPatterns(SQL_REGEXPS);
	
	public static boolean isNotSafe(List<String> keys){
		return !isSafe(keys);
	}

	public static boolean isSafe(List<String> keys){
		if(CommonUtils.isEmpty(keys)){
			return true;
		}

		for(String str : keys){
			if(isNotSafe(str)){
				return false;
			}
		}
		return true;
	}

	public static boolean isNotSafe(String str){
		return !isSafe(str);
	}

	public static boolean isSafe(String str){
		if(CommonUtils.isEmpty(str)){
			return true;
		}
		
		for(Pattern pattern : validationPatterns){
			if(matches(pattern, str)){
				return false;
			}
		}
		return true;
	}

	public static boolean isSafe(Object value){
		if(value == null){
			return true;
		}

		if(value instanceof CharSequence){
			return isSafe(value.toString());
		}

		if(value instanceof Number || value instanceof Boolean){
			return true;
		}

		if(value instanceof Collection<?> collection){
			for(Object element : collection){
				if(!isSafe(element)){
					return false;
				}
			}
			return true;
		}

		if(value.getClass().isArray()){
			int length = Array.getLength(value);
			for(int index = 0; index < length; index++){
				Object element = Array.get(value, index);
				if(!isSafe(element)){
					return false;
				}
			}
			return true;
		}

		return isSafe(value.toString());
	}
	
	private static boolean matches(Pattern pattern, String str){
		Matcher matcher = pattern.matcher(str);
		return matcher.matches();
	}
	
	private static List<Pattern> buildPatterns(String[] regex){
		List<Pattern> patterns = new ArrayList<Pattern>();
		for(String expression : regex){
		    patterns.add(getPattern(expression));
		}
		return patterns;
	}
	
	
	private static Pattern getPattern(String regEx){
		return Pattern.compile(regEx, Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);
	}
	

	

}
