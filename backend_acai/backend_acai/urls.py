from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
# Importamos as views, incluindo a nova LojaViewSet
from core.views import CategoriaViewSet, ProdutoViewSet, LojaViewSet, CriarPagamentoPixView, VerificarPagamentoView

router = DefaultRouter()
# Rota para o site buscar as cores e dados da loja (SaaS)
router.register(r'lojas', LojaViewSet) 
# Rotas de produtos e categorias (agora filtradas por loja)
router.register(r'categorias', CategoriaViewSet, basename='categoria')
router.register(r'produtos', ProdutoViewSet, basename='produto')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    
    # Rota para gerar o Pix
    path('api/criar-pix/', CriarPagamentoPixView.as_view()),
    
    # Rota para verificar se pagou
    path('api/verificar-pagamento/<int:payment_id>/', VerificarPagamentoView.as_view()),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)