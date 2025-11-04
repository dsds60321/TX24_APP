package kr.tx24.fc.util;

import kr.tx24.lib.map.SharedMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class SmsUtil {

    private static Logger logger = LoggerFactory.getLogger(SmsUtil.class);

    public static boolean sendSms(String phoneNumber, SharedMap<String,Object> tmplMap) {
        logger.info("phoneNumber : {} , tmplMap : {}", phoneNumber, tmplMap);
        return true;
    }
}
