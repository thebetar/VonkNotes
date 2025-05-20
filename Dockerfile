FROM php:8.2-apache

# Install database dependencies
RUN docker-php-ext-install pdo pdo_mysql

# Install htaccess support
RUN a2enmod rewrite
