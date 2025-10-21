package kr.tx24.fc.main;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import kr.tx24.lib.lb.LoadBalancer;
import kr.tx24.was.main.Server;

public class Launcher {

	private static Logger logger 				= LoggerFactory.getLogger(Launcher.class );
	
	public static void main(String[] args) {
		//기본 로깅에 대해서 console, file, remote 에 대한 설정
        // 이 부분은 Logback 설정을 통해 이루어져야 합니다.

		try{
			// IPv4를 사용하도록 강제
	        System.setProperty("java.net.preferIPv4Stack", "true");
	        // JVM 모니터링 
	        System.setProperty("JVM_MONITOR", "true");
	        
	        
			LoadBalancer.start(10);
			new Server().start();
			
		}catch(Exception e){
			logger.error("Server startup failed", e); // 스택 트레이스를 로거로 출력
			System.exit(1); // 비정상 종료
		}
	}

}
