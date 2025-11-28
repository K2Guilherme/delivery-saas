#!/usr/bin/env bash
# Parar se der erro
set -o errexit

# 1. Instalar as bibliotecas
pip install -r requirements.txt

# 2. Arrumar as imagens e CSS
python manage.py collectstatic --no-input

# 3. Atualizar o Banco de Dados
python manage.py migrate

# 4. Criar o Superusuário (Automático)
# (Só cria se você tiver configurado as variáveis no site do Render)
if [[ -n "$DJANGO_SUPERUSER_USERNAME" ]]; then
    echo "Criando superusuário..."
    python manage.py createsuperuser --no-input || echo "Superusuário já existe."
fi