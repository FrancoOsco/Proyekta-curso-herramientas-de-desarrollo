package com.curso.marcos_de_desarroll_web.springboot.web.springboot_web.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.curso.marcos_de_desarroll_web.springboot.web.springboot_web.model.Usuario;
import com.curso.marcos_de_desarroll_web.springboot.web.springboot_web.repository.UsuarioRepository;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDatabase(UsuarioRepository usuarioRepository) {
        return args -> {

            if (usuarioRepository.count() == 0) {

                Usuario admin = new Usuario();
                admin.setNombre("Administrador");
                admin.setUsername("admin");
                admin.setPassword("123456");

                usuarioRepository.save(admin);

                System.out.println("=================================");
                System.out.println("USUARIO ADMINISTRADOR CREADO");
                System.out.println("usuario: admin");
                System.out.println("password: 123456");
                System.out.println("=================================");
            }
        };
    }
}