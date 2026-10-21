"""/api/lead-intake - public form submissions, handed over by the frontend (leads/views.py)."""

from django.urls import path

from leads import views

app_name = "leads_api"  # "leads" is the admin inbox (leads/viewsets.py)

urlpatterns = [
    path("lead-intake", views.lead_intake, name="intake"),
]
