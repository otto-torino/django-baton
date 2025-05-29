from news.models import News
from django.http.response import JsonResponse
from django.contrib.admin.views.decorators import staff_member_required


@staff_member_required
def admin_search(request):
    text = request.GET.get("text", None)
    res = []
    news = News.objects.all()
    if text:
        news = news.filter(title__icontains=text)
    for n in news:
        res.append(
            {
                "label": str(n) + " edit",
                "url": "/admin/news/news/%d/change" % n.id,
                "icon": "edit",
            }
        )
    if text.lower() in "Lucio Dalla Wikipedia".lower():
        res.append(
            {
                "label": "Lucio Dalla Wikipedia",
                "url": "https://www.google.com",
                "icon": "menu_book",
            }
        )
    return JsonResponse({"length": len(res), "data": res})
