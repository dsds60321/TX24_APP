package kr.tx24.fc.service;

import io.lettuce.core.RedisClient;
import kr.tx24.fc.enums.MockNames;
import kr.tx24.fc.enums.TxResultCode;
import kr.tx24.fc.exception.TxException;
import kr.tx24.fc.repository.DummyRepository;
import kr.tx24.fc.util.EmailUtil;
import kr.tx24.fc.util.SmsUtil;
import kr.tx24.lib.lang.IDUtils;
import kr.tx24.lib.lang.MsgUtils;
import kr.tx24.lib.map.SharedMap;
import kr.tx24.lib.map.TypeRegistry;
import kr.tx24.lib.redis.Redis;
import kr.tx24.lib.redis.RedisUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;

@Service
public class NotificationService {


    private final Logger logger = LoggerFactory.getLogger(NotificationService.class);
    public static final String TWO_FACTOR_FORMAT = "TX_TWO_FACTOR|{}|{}";

    /**
     * 2차 인증 발송
     */
    public void sendTwoFactorAuth(String csrf, String type, String to) {
        type = type.toUpperCase();

        try {
            // 재발송 방지
            String twoFactorRedisKey = MsgUtils.format(TWO_FACTOR_FORMAT, type, csrf);
            if (RedisUtils.exists(twoFactorRedisKey)) {
                throw new TxException(TxResultCode.INVALID_REQUEST, "이미 발송된 요청입니다. 요청받으신 인증번호를 확인하여 다시 시도해주세요.");
            }

            List<SharedMap<String, Object>> rows = DummyRepository.of(MockNames.TMPL, TypeRegistry.LIST_SHAREDMAP_OBJECT);
            if (rows.isEmpty()) {
                throw new TxException(TxResultCode.INTERNAL_ERROR, "2차인증 요청 가능한 템플릿이 없습니다.");
            }

            String finalType = type;

            // 2차 인증 템플렛 조회
            SharedMap<String, Object> tmplMap = rows.stream()
                    .filter(row ->
                            row.isEquals("id", "TWO_FACTOR") &&
                                    row.isEquals("msgType", finalType))
                    .findFirst()
                    .orElseThrow(() -> new TxException(TxResultCode.INTERNAL_ERROR, "2차인증 요청 가능한 템플릿 타입이 없습니다."));

            String content = tmplMap.getString("tmpl");
            String randomKey = IDUtils.genKey(6);
            content = MsgUtils.format(content, IDUtils.genKey(6));


            // 2차인증 전송
            switch (type) {
                case "EMAIL" -> EmailUtil.sendEmail(List.of(to)
                        , tmplMap.getString("from")
                        , tmplMap.getString("subject")
                        , content);

                case "SMS" -> SmsUtil.sendSms(tmplMap.getString("sender")
                        , content);

                default -> throw new TxException(TxResultCode.INVALID_REQUEST, "지원하지 않는 2차인증 타입 입니다.");
            }

            logger.info("TWO_FACTOR SEND | TO : {} : value : {} ", to, randomKey);

            // 2차 인증 유효기간 5분
            RedisClient client = Redis.getClient();
            RedisUtils.set(twoFactorRedisKey, randomKey, Duration.ofMinutes(5).getSeconds());
        } catch (Exception e) {
            logger.info("sendTwoFactorAuth error : {} ", e.getMessage());
            RedisUtils.del(MsgUtils.format(TWO_FACTOR_FORMAT, to));
            throw new TxException(TxResultCode.INVALID_REQUEST, e instanceof TxException ? e.getMessage() : "2차인증 요청에 실패했습니다.");
        }
    }


}
