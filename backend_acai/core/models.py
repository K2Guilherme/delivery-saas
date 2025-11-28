from django.db import models
from django.contrib.auth.models import User

class Loja(models.Model):
    dono = models.OneToOneField(User, on_delete=models.CASCADE, related_name='loja', null=True, blank=True)
    
    nome = models.CharField(max_length=100)
    slug = models.SlugField(unique=True, help_text="Identificador na URL")
    
    # --- NOVOS CAMPOS DE INFORMAÇÃO ---
    descricao = models.TextField(blank=True, null=True, help_text="Uma frase curta sobre a loja")
    endereco = models.CharField(max_length=200, blank=True, null=True, help_text="Endereço completo")
    instagram = models.CharField(max_length=50, blank=True, null=True, help_text="Ex: @lojadogui")
    # ----------------------------------

    cor_primaria = models.CharField(max_length=7, default="#6b21a8")
    cor_secundaria = models.CharField(max_length=7, default="#4c1d95")
    telefone_whatsapp = models.CharField(max_length=15)
    logo = models.ImageField(upload_to='logos/', blank=True, null=True)
    
    def __str__(self):
        return self.nome

class Categoria(models.Model):
    loja = models.ForeignKey(Loja, on_delete=models.CASCADE, related_name='categorias', null=True)
    nome = models.CharField(max_length=50)
    ordem = models.IntegerField(default=0)

    def __str__(self):
        return self.nome

    class Meta:
        verbose_name = "Categoria"
        verbose_name_plural = "Categorias"
        ordering = ['ordem']

class Produto(models.Model):
    loja = models.ForeignKey(Loja, on_delete=models.CASCADE, related_name='produtos', null=True)
    nome = models.CharField(max_length=100)
    descricao = models.TextField(blank=True, null=True)
    preco = models.DecimalField(max_digits=10, decimal_places=2)
    categoria = models.ForeignKey(Categoria, on_delete=models.PROTECT)
    imagem = models.ImageField(upload_to='produtos/', blank=True, null=True)
    ativo = models.BooleanField(default=True)

    def __str__(self):
        return self.nome

    class Meta:
        verbose_name = "Produto"
        verbose_name_plural = "Produtos"