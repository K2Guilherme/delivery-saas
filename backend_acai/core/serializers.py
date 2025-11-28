from rest_framework import serializers
from .models import Categoria, Produto, Loja

class LojaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Loja
        # Lista atualizada com os novos campos que criámos no models.py
        fields = [
            'id', 
            'nome', 
            'slug', 
            'cor_primaria', 
            'cor_secundaria', 
            'telefone_whatsapp', 
            'logo',
            # Novos campos adicionados:
            'descricao', 
            'endereco', 
            'instagram'
        ]

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['id', 'nome', 'ordem']

class ProdutoSerializer(serializers.ModelSerializer):
    categoria_nome = serializers.CharField(source='categoria.nome', read_only=True)

    class Meta:
        model = Produto
        fields = ['id', 'nome', 'descricao', 'preco', 'categoria', 'categoria_nome', 'imagem']