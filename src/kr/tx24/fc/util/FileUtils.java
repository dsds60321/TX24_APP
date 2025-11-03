package kr.tx24.fc.util;

import kr.tx24.lib.lang.CommonUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;

public final class FileUtils {

    private static Logger logger = LoggerFactory.getLogger(FileUtils.class);

    public static Path getWebPath() {
        try {
            String path;
            // 운영 체제 확인
            String os = System.getProperty("os.name").toLowerCase();

            if (os.contains("win") || os.contains("mac")) {
                // 맥, Windows 환경
                path = "./webroot";
            } else {
                // 리눅스 환경
                path = "../webroot"; // 맥에서도 ./webroot 사용
            }

            return Paths.get(new File(path).getCanonicalPath());
        } catch (IOException e) {
            logger.warn("FileUtil.getWebPath error : {} ", CommonUtils.getExceptionMessage(e, 1000));
            return Path.of("");
        }
    }

}
