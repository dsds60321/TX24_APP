package kr.tx24.fc.repository;

import kr.tx24.lib.db.Retrieve;
import kr.tx24.lib.map.SharedMap;
import org.springframework.stereotype.Repository;

@Repository
public class SignRps {

    public SharedMap<String, Object> findUserById(String id) {
        return new Retrieve("SYSLINK.USER_ADMIN A")
				.column("A.id")
				.joinLeftOuter("SYSLINK.USER_PW  B", """
						A.id = B.id AND B.idx = (
							SELECT MAX(idx)
							FROM SYSLINK.USER_PW
							WHERE USER_PW.id = A.id
						)
						""")
				.where("A.id", id)
				.select()
				.getRow(0);
    }
}
