package com.tikiscore_server.config;

import com.tikiscore_server.championat.Championat;
import com.tikiscore_server.championat.ChampionatRepository;
import com.tikiscore_server.championat.enums.CompetitionFormat;
import com.tikiscore_server.role.RoleName;
import com.tikiscore_server.role.RoleRepository;
import com.tikiscore_server.user.User;
import com.tikiscore_server.user.UserRepository;
import java.time.LocalDate;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 *
 * @author Miguel
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;
    private final RoleRepository roleRepo;
    private final ChampionatRepository champRepo;

    public DataSeeder(UserRepository userRepo, PasswordEncoder passwordEncoder, RoleRepository roleRepo, ChampionatRepository champRepo) {
        this.userRepo = userRepo;
        this.passwordEncoder = passwordEncoder;
        this.roleRepo = roleRepo;
        this.champRepo = champRepo;
    }

    @Override
    public void run(String... args) throws Exception {

        if (userRepo.findByUsernameIgnoreCase("admin").isEmpty()) {
            User user = new User();
            user.setUsername("admin");
            user.setDisplayName("ADMIN");
            user.setPasswordHash(passwordEncoder.encode("Admin1@azerty"));
            user.getRoles().add(roleRepo.findByName(RoleName.ADMIN).get());
            userRepo.save(user);
        } else if (userRepo.findByUsernameIgnoreCase("admincom").isEmpty()) {
            User user = new User();
            user.setUsername("admincom");
            user.setDisplayName("ADMINCOM");
            user.setPasswordHash(passwordEncoder.encode("Admin1@azerty"));
            user.getRoles().add(roleRepo.findByName(RoleName.COMPETITION_ADMIN).get());
            userRepo.save(user);
        } else if (champRepo.findBySlug("championat-elite-vacance").isEmpty()) {
            Championat championat = new Championat();
            championat.setName("ELITE VACANCE DEV");
            championat.setSlug("championat-elite-vacance");
            championat.setEdition("2026-2027");
            championat.setDescription("Championat du Quartier pour les vacances en mode DEV");
            championat.setLocalite("CEPER");
            championat.setStartDate(LocalDate.now());
            championat.setEndDate(LocalDate.of(2027, 5, 10));
            championat.setFormat(CompetitionFormat.GROUPES_ET_ELIMINATOIRE);
            championat.setOrganisateur(userRepo.findByUsernameIgnoreCase("admincom").get());
            champRepo.save(championat);
        } else {
            System.out.println("------------------------------------------------");
            System.out.println("--ok-------------------OK-------------------ok--");
            System.out.println("------------------------------------------------");

        }
    }

}
