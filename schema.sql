-- Criação do banco de dados (caso não exista)
CREATE DATABASE IF NOT EXISTS `public_performer` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `public_performer`;

-- Tabela: perfil
CREATE TABLE IF NOT EXISTS `perfil` (
    `id` INT PRIMARY KEY DEFAULT 1,
    `nome` VARCHAR(255) NOT NULL DEFAULT 'Orador',
    `configuracoes_padrao` JSON NOT NULL,
    `meta_sessoes_semana` INT DEFAULT 3,
    `pontos` INT DEFAULT 0,
    `conquistas` JSON NOT NULL,
    CONSTRAINT `check_single_row` CHECK (`id` = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: roteiros
CREATE TABLE IF NOT EXISTS `roteiros` (
    `id` VARCHAR(36) PRIMARY KEY,
    `titulo` VARCHAR(255) NOT NULL,
    `descricao` TEXT NULL,
    `categoria` VARCHAR(50) NOT NULL DEFAULT 'Apresentação',
    `conteudo` LONGTEXT NULL,
    `configuracoes` JSON NOT NULL,
    `criado_em` DATETIME NOT NULL,
    `atualizado_em` DATETIME NOT NULL,
    `ultimo_uso_em` DATETIME NULL,
    `total_sessoes` INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: sessoes_treino
CREATE TABLE IF NOT EXISTS `sessoes_treino` (
    `id` VARCHAR(36) PRIMARY KEY,
    `roteiro_id` VARCHAR(36) NULL,
    `roteiro_titulo` VARCHAR(255) NOT NULL,
    `nivel` VARCHAR(50) NOT NULL,
    `iniciado_em` DATETIME NOT NULL,
    `metricas` JSON NOT NULL,
    `observacoes` TEXT NULL,
    `gravacao_id` VARCHAR(36) NULL,
    `gravacao_tipo` VARCHAR(20) NULL,
    FOREIGN KEY (`roteiro_id`) REFERENCES `roteiros`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela: feedbacks
CREATE TABLE IF NOT EXISTS `feedbacks` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `sessao_id` VARCHAR(36) NOT NULL,
    `tipo` ENUM('forte', 'melhoria', 'recomendacao') NOT NULL,
    `texto` TEXT NOT NULL,
    FOREIGN KEY (`sessao_id`) REFERENCES `sessoes_treino`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir dados básicos iniciais no perfil caso não existam
INSERT IGNORE INTO `perfil` (`id`, `nome`, `configuracoes_padrao`, `meta_sessoes_semana`, `pontos`, `conquistas`) 
VALUES (
    1, 
    'Orador', 
    '{"wpm": 140, "fontSize": 46, "lineHeight": 1.5, "readingWidth": 72, "contrast": 100, "theme": "dark", "mirrored": false, "align": "center", "level": "iniciante"}', 
    3, 
    0, 
    '[]'
);

-- Tabela: controles_remotos
CREATE TABLE IF NOT EXISTS `controles_remotos` (
    `roteiro_id` VARCHAR(36) PRIMARY KEY,
    `comando` VARCHAR(50) NOT NULL,
    `timestamp` BIGINT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

