from rest_framework import viewsets, views, status
from rest_framework.response import Response
from .models import Categoria, Produto, Loja
from .serializers import CategoriaSerializer, ProdutoSerializer, LojaSerializer
import mercadopago

# ⚠️ IMPORTANTE: COLE AQUI O SEU TOKEN DE PRODUÇÃO (APP_USR-...)
SDK_ACCESS_TOKEN = "APP_USR-420779633954782-112714-a85bdf27f4286677706441b0ae03cdc7-382033262" 

# --- API PARA IDENTIFICAR A LOJA ---
class LojaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Loja.objects.all()
    serializer_class = LojaSerializer
    lookup_field = 'slug' # Permite buscar pelo link (ex: /api/lojas/sushi-top/)

# --- CATEGORIAS (FILTRADAS) ---
class CategoriaViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CategoriaSerializer
    
    def get_queryset(self):
        # Só devolve as categorias da loja que o site pediu
        slug_loja = self.request.query_params.get('loja')
        if slug_loja:
            return Categoria.objects.filter(loja__slug=slug_loja).order_by('ordem')
        return Categoria.objects.none() # Se não disser a loja, não mostra nada (Segurança)

# --- PRODUTOS (FILTRADOS) ---
class ProdutoViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ProdutoSerializer

    def get_queryset(self):
        # Só devolve os produtos da loja específica
        slug_loja = self.request.query_params.get('loja')
        if slug_loja:
            return Produto.objects.filter(loja__slug=slug_loja, ativo=True).order_by('categoria__ordem', 'nome')
        return Produto.objects.none()

# --- SISTEMA DE PIX (MANTIDO) ---
class CriarPagamentoPixView(views.APIView):
    def post(self, request):
        try:
            sdk = mercadopago.SDK(SDK_ACCESS_TOKEN)
        except Exception as e:
            return Response({"error": "Erro no SDK"}, status=400)
        
        total = float(request.data.get("total", 0))
        email = request.data.get("email", "cliente@email.com")
        nome = request.data.get("nome", "Cliente")
        
        payment_data = {
            "transaction_amount": total,
            "description": "Pedido App Multi-Loja",
            "payment_method_id": "pix",
            "payer": {
                "email": email,
                "first_name": nome
            }
        }

        payment_response = sdk.payment().create(payment_data)
        payment = payment_response["response"]

        if payment_response["status"] == 201:
            return Response({
                "id": payment["id"],
                "qr_code": payment["point_of_interaction"]["transaction_data"]["qr_code"],
                "qr_code_base64": payment["point_of_interaction"]["transaction_data"]["qr_code_base64"],
                "status": "created"
            })
        else:
            return Response(payment, status=status.HTTP_400_BAD_REQUEST)

# --- VERIFICAÇÃO DE STATUS ---
class VerificarPagamentoView(views.APIView):
    def get(self, request, payment_id):
        sdk = mercadopago.SDK(SDK_ACCESS_TOKEN)
        payment_response = sdk.payment().get(payment_id)
        payment = payment_response["response"]
        
        return Response({
            "status": payment.get("status", "erro"),
            "status_detail": payment.get("status_detail", "")
        })