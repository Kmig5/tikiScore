package com.tikiscore_server;

import com.tikiscore_server.Player.Player;
import com.tikiscore_server.championat.Championat;
import com.tikiscore_server.announcement.Announcement;
import com.tikiscore_server.audit.AuditLog;
import com.tikiscore_server.equipe.Equipe;
import com.tikiscore_server.forum.Discussion;
import com.tikiscore_server.forum.DiscussionReply;
import com.tikiscore_server.forum.ForumCategory;
import com.tikiscore_server.forum.ForumReport;
import com.tikiscore_server.match.Match;
import com.tikiscore_server.match.MatchEvent;
import com.tikiscore_server.notification.Notification;
import com.tikiscore_server.notification.NotificationPreferences;
import com.tikiscore_server.role.Role;
import com.tikiscore_server.user.User;
import jakarta.persistence.EntityManager;
import jakarta.persistence.metamodel.EntityType;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest(classes = TikiscoreServerApplication.class, properties = {
		"spring.datasource.url=jdbc:h2:mem:tikiscore;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
		"spring.datasource.driver-class-name=org.h2.Driver",
		"spring.datasource.username=sa",
		"spring.datasource.password=",
		"spring.jpa.hibernate.ddl-auto=create-drop"
})
class TikiscoreServerApplicationTests {
	@Autowired
	private EntityManager entityManager;

	@Test
	void contextLoads() {
	}

	@Test
	void allEntitiesInheritGeneratedUuidIdentifier() {
		assertUuidIdentifier(Championat.class);
		assertUuidIdentifier(AuditLog.class);
		assertUuidIdentifier(Announcement.class);
		assertUuidIdentifier(Equipe.class);
		assertUuidIdentifier(ForumCategory.class);
		assertUuidIdentifier(Discussion.class);
		assertUuidIdentifier(DiscussionReply.class);
		assertUuidIdentifier(ForumReport.class);
		assertUuidIdentifier(Match.class);
		assertUuidIdentifier(MatchEvent.class);
		assertUuidIdentifier(Notification.class);
		assertUuidIdentifier(NotificationPreferences.class);
		assertUuidIdentifier(Player.class);
		assertUuidIdentifier(User.class);
		assertUuidIdentifier(Role.class);
	}

	private void assertUuidIdentifier(Class<?> entityClass) {
		EntityType<?> entityType = entityManager.getMetamodel().entity(entityClass);
		assertEquals("id", entityType.getId(entityType.getIdType().getJavaType()).getName());
		assertEquals(java.util.UUID.class, entityType.getIdType().getJavaType());
		assertNotNull(entityType.getSingularAttribute("createdAt"));
	}

}
