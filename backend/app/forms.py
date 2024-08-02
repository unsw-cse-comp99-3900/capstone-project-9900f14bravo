from django import forms

class MultiFileInput(forms.ClearableFileInput):
    allow_multiple_selected = True

class MultiFileField(forms.FileField):
    widget = MultiFileInput

class UploadFilesForm(forms.Form):
    case_files = MultiFileField(required=False)
    control_files = MultiFileField(required=False)
    protein_file = forms.FileField(required=False)