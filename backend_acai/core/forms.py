from django import forms
from .models import Loja

class LojaForm(forms.ModelForm):
    class Meta:
        model = Loja
        fields = '__all__'
        widgets = {
            # Isto transforma o campo de texto num seletor de cor HTML5
            'cor_primaria': forms.TextInput(attrs={'type': 'color', 'style': 'width: 100px; height: 40px; cursor: pointer;'}),
            'cor_secundaria': forms.TextInput(attrs={'type': 'color', 'style': 'width: 100px; height: 40px; cursor: pointer;'}),
        }