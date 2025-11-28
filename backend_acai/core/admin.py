from django.contrib import admin
from .models import Loja, Categoria, Produto
from .forms import LojaForm  # Importamos o formulário de cores que você já criou
from django.utils.html import format_html

# --- Personalização do Cabeçalho ---
admin.site.site_header = "Painel Delivery SaaS"
admin.site.site_title = "Admin"
admin.site.index_title = "Gestão de Lojas"

# --- Mixin SaaS (Lógica de Segurança) ---
class SaasAdminMixin:
    """
    Garante que cada utilizador vê apenas os dados da sua própria loja.
    """
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        # Se for o Chefe (Superuser), vê tudo
        if request.user.is_superuser:
            return qs
        # Se for um Dono de Loja, vê apenas a sua loja
        if hasattr(request.user, 'loja'):
            return qs.filter(loja=request.user.loja)
        return qs.none()

    def save_model(self, request, obj, form, change):
        # Preenche a loja automaticamente se não for superuser
        if not request.user.is_superuser and hasattr(request.user, 'loja'):
            obj.loja = request.user.loja
        super().save_model(request, obj, form, change)
    
    def get_exclude(self, request, obj=None):
        # Esconde o campo 'loja' para donos comuns (para não mudarem por engano)
        if not request.user.is_superuser:
            return ['loja']
        return []

# --- Configuração dos Modelos ---

@admin.register(Loja)
class LojaAdmin(admin.ModelAdmin):
    form = LojaForm  # <-- AQUI ATIVAMOS O SELETOR DE CORES 🎨
    
    list_display = ('nome', 'slug', 'dono', 'ver_cor', 'telefone_whatsapp')
    prepopulated_fields = {'slug': ('nome',)}
    search_fields = ('nome', 'slug')
    
    # Cria a "bolinha" colorida na lista
    def ver_cor(self, obj):
        return format_html(
            '<div style="width: 25px; height: 25px; background-color: {}; border-radius: 50%; border: 1px solid #ccc; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"></div>',
            obj.cor_primaria
        )
    ver_cor.short_description = "Cor Principal"

    # Filtra para que um dono não veja as lojas dos outros (caso tenha permissão de ver lojas)
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        if hasattr(request.user, 'loja'):
            return qs.filter(id=request.user.loja.id)
        return qs.none()

@admin.register(Categoria)
class CategoriaAdmin(SaasAdminMixin, admin.ModelAdmin):
    list_display = ('nome', 'loja', 'ordem')
    list_filter = ('loja',)
    search_fields = ('nome',)
    ordering = ('loja', 'ordem')

@admin.register(Produto)
class ProdutoAdmin(SaasAdminMixin, admin.ModelAdmin):
    list_display = ('ver_imagem', 'nome', 'preco', 'categoria', 'loja', 'ativo')
    list_display_links = ('ver_imagem', 'nome')
    list_filter = ('loja', 'categoria', 'ativo')
    search_fields = ('nome', 'descricao')
    list_editable = ('preco', 'ativo')
    list_per_page = 20
    save_on_top = True
    
    def ver_imagem(self, obj):
        if obj.imagem:
            return format_html('<img src="{}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 6px;" />', obj.imagem.url)
        return "-"
    ver_imagem.short_description = "Foto"