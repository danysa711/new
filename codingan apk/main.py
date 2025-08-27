import pyautogui
import time
import subprocess
import json
import cv2
import numpy as np
import pandas as pd
from datetime import datetime
import pytz
import pyperclip
import os
import sys
import pytesseract
from PIL import Image
import traceback
import re
import requests

is_dev = os.getenv("NODE_ENV") == "development"

if len(sys.argv) > 1:
    base_path = sys.argv[1]
else:
    base_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../data"))
    
if is_dev:
    script_path = os.path.abspath("./script/get_data.py")
    command = ["python", script_path, base_path]
    image_path = "./assets/screenshot/total_orders.png"
else:
    script_path = os.path.join(base_path, "..", "bin", "get_data", "get_data.exe")
    command = [script_path, base_path]
    image_path = os.path.join(base_path, "..", "assets", "screenshot", "total_orders.png")

config_file_path = os.path.join(base_path, "sys", "config.json")
log_file_path = os.path.join(base_path, "app.log")

i_cht_path = os.path.join(base_path, "..", "assets", "img", "icon_chat.png")
i_hide_cht_path = os.path.join(base_path, "..", "assets", "img", "icon_hide_cht.png")
i_send_msg_path = os.path.join(base_path, "..", "assets", "img", "icon_send_msg.png")
i_input_msg_path = os.path.join(base_path, "..", "assets", "img", "tulis_pesan.png")
i_send_card_path = os.path.join(base_path, "..", "assets", "img", "tombol_kirim_card.png")
i_send_popup_path = os.path.join(base_path, "..", "assets", "img", "tombol_kirim_popup.png")
i_refresh_page_path = os.path.join(base_path, "..", "assets", "img", "tombol_refresh.png")

with open(config_file_path, "r") as file:
    config_data = json.load(file)
    
btn_refresh_page_x = int(config_data.get("coordinate", {}).get("btn_refresh_page_x", 0))
btn_refresh_page_y = int(config_data.get("coordinate", {}).get("btn_refresh_page_y", 0))
icon_cht_x = int(config_data.get("coordinate", {}).get("icon_cht_x", 0))
icon_cht_y = int(config_data.get("coordinate", {}).get("icon_cht_y", 0))
input_chat_x = int(config_data.get("coordinate", {}).get("input_chat_x", 0))
input_chat_y = int(config_data.get("coordinate", {}).get("input_chat_y", 0))
tombol_kirim_popup_x = int(config_data.get("coordinate", {}).get("btn_send_popup_x", 0))
tombol_kirim_popup_y = int(config_data.get("coordinate", {}).get("btn_send_popup_y", 0))
btn_send_cht_x = int(config_data.get("coordinate", {}).get("btn_send_cht_x", 0))
btn_send_cht_y = int(config_data.get("coordinate", {}).get("btn_send_cht_y", 0))
btn_close_cht_x = int(config_data.get("coordinate", {}).get("btn_close_cht_x", 0))
btn_close_cht_y = int(config_data.get("coordinate", {}).get("btn_close_cht_y", 0))
btn_send_card_x = int(config_data.get("coordinate", {}).get("btn_send_card_x", 0))
btn_send_card_y = int(config_data.get("coordinate", {}).get("btn_send_card_y", 0))
total_pesanan_x = int(config_data.get("total_pesanan", {}).get("total_pesanan_x", 0))
total_pesanan_y = int(config_data.get("total_pesanan", {}).get("total_pesanan_y", 0))
total_pesanan_p = int(config_data.get("total_pesanan", {}).get("total_pesanan_p", 0))
total_pesanan_l = int(config_data.get("total_pesanan", {}).get("total_pesanan_l", 0))
testing_mode = bool(config_data.get("testing_mode", False))
message_template = config_data.get("message_template", "")
item_template = config_data.get("item_template", "")
database_url = config_data.get("db_url", "")
token = config_data.get("token", "")
refresh_token = config_data.get("refreshToken", "")
USERNAME = config_data.get("username", "")
PASSWORD = config_data.get("password", "")
auto_refresh_interval = int(config_data.get("auto_refresh_interval", 600))  # Default 10 menit
max_retries_api = int(config_data.get("max_retries_api", 3))
check_interval = int(config_data.get("check_interval", 10))  # Default 10 detik

if sys.stdout:
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        sys.stdout = None
        
def generate_message(template, data):
    return re.sub(r'{{(.*?)}}', lambda match: str(data.get(match.group(1).strip(), "")), template)
 
def find_icon(template_path, use_grayscale=True, position="center", threshold=0.6, max_attempts=5, delay=1, scale_range=(0.5, 1.5, 0.1), offset=10):
    """Mencari ikon di layar dengan multi-scale template matching dan menentukan titik klik berdasarkan posisi yang dipilih."""
    
    # Baca template dengan opsi grayscale atau warna
    template = cv2.imread(template_path, cv2.IMREAD_GRAYSCALE if use_grayscale else cv2.IMREAD_COLOR)
    if template is None:
        print(f"Template tidak ditemukan: {template_path}")
        return None

    for attempt in range(1, max_attempts + 1):
        screenshot = np.array(pyautogui.screenshot())

        # Konversi ke format OpenCV
        if use_grayscale:
            screenshot = cv2.cvtColor(screenshot, cv2.COLOR_RGB2GRAY)
        else:
            screenshot = cv2.cvtColor(screenshot, cv2.COLOR_RGB2BGR)

        best_match = None
        best_val = 0
        best_loc = None
        best_scale = 1.0

        # Coba beberapa skala (zoom in & zoom out)
        for scale in np.arange(scale_range[0], scale_range[1], scale_range[2]):
            resized_template = cv2.resize(template, None, fx=scale, fy=scale, interpolation=cv2.INTER_LINEAR)

            if resized_template.shape[0] > screenshot.shape[0] or resized_template.shape[1] > screenshot.shape[1]:
                continue  # Lewati jika template lebih besar dari layar

            result = cv2.matchTemplate(screenshot, resized_template, cv2.TM_CCOEFF_NORMED)
            _, max_val, _, max_loc = cv2.minMaxLoc(result)

            if max_val > best_val:
                best_match = resized_template
                best_val = max_val
                best_loc = max_loc
                best_scale = scale

        if best_val >= threshold:
            width, height = best_match.shape[1], best_match.shape[0]

            # Tentukan titik klik dengan offset agar tidak terlalu pinggir
            if position == "center":
                icon_x = best_loc[0] + width // 2
                icon_y = best_loc[1] + height // 2
            elif position == "top":
                icon_x = best_loc[0] + width // 2
                icon_y = best_loc[1] + offset
            elif position == "bottom":
                icon_x = best_loc[0] + width // 2
                icon_y = best_loc[1] + height - offset
            elif position == "left":
                icon_x = best_loc[0] + offset
                icon_y = best_loc[1] + height // 2
            elif position == "right":
                icon_x = best_loc[0] + width - offset
                icon_y = best_loc[1] + height // 2
            elif position == "top-left":
                icon_x = best_loc[0] + offset
                icon_y = best_loc[1] + offset
            elif position == "top-right":
                icon_x = best_loc[0] + width - offset
                icon_y = best_loc[1] + offset
            elif position == "bottom-left":
                icon_x = best_loc[0] + offset
                icon_y = best_loc[1] + height - offset
            elif position == "bottom-right":
                icon_x = best_loc[0] + width - offset
                icon_y = best_loc[1] + height - offset
            else:
                icon_x = best_loc[0] + width // 2
                icon_y = best_loc[1] + height // 2  # Default ke tengah

            log_message(f"Ikon ditemukan pada ({icon_x}, {icon_y}) dengan skala {best_scale}, posisi klik: {position}")
            return icon_x, icon_y

        log_message(f"Percobaan {attempt}: Ikon {template_path} belum ditemukan, coba lagi...")
        time.sleep(delay)

    print(f"Gagal menemukan ikon {template_path} setelah {max_attempts} percobaan.")
    return None

def find_icon_orb(template_path, max_attempts=5, delay=1):
    """Mencari ikon di layar menggunakan ORB dengan koordinat tengah ikon."""

    # Load template image
    template = cv2.imread(template_path, cv2.IMREAD_GRAYSCALE)
    if template is None:
        print(f"Template tidak ditemukan: {template_path}")
        return None

    # Perbesar jika kecil (solusi masalah 3)
    if template.shape[0] < 50 or template.shape[1] < 50:
        template = cv2.resize(template, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)

    # Inisialisasi ORB detector dengan lebih banyak fitur
    orb = cv2.ORB_create(nfeatures=1000)

    # Deteksi keypoints dan deskriptor dari template
    kp_template, des_template = orb.detectAndCompute(template, None)

    if des_template is None or len(kp_template) == 0:
        print("Gagal mendeteksi fitur pada template. Coba gunakan ikon yang lebih besar atau lebih detail.")
        return None

    for attempt in range(1, max_attempts + 1):
        # Ambil screenshot layar
        screenshot = np.array(pyautogui.screenshot())
        screenshot_gray = cv2.cvtColor(screenshot, cv2.COLOR_RGB2GRAY)

        # Deteksi keypoints dan deskriptor di screenshot
        kp_screen, des_screen = orb.detectAndCompute(screenshot_gray, None)

        if des_screen is None or len(kp_screen) == 0:
            print(f"Percobaan {attempt}: Gagal mendeteksi fitur pada layar.")
            continue

        # Gunakan matcher (BFMatcher dengan Hamming distance)
        bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
        matches = bf.match(des_template, des_screen)

        # Urutkan berdasarkan jarak
        matches = sorted(matches, key=lambda x: x.distance)

        # Jika cukup banyak kecocokan, ambil lokasi terbaik
        if len(matches) > 10:  
            matched_points = [kp_screen[m.trainIdx].pt for m in matches[:10]]  
            
            avg_x = sum(p[0] for p in matched_points) / len(matched_points)
            avg_y = sum(p[1] for p in matched_points) / len(matched_points)

            print(f"Ikon ditemukan pada: ({int(avg_x)}, {int(avg_y)})")
            return int(avg_x), int(avg_y)

        print(f"Percobaan {attempt}: Ikon belum ditemukan, coba lagi...")
        time.sleep(delay)

    print(f"Gagal menemukan ikon setelah {max_attempts} percobaan.")
    return None

def chat_process(username, message):
    pyperclip.copy(message)
    send_to_frontend(f"Mengirim chat ke {username}...")
    log_message(f"Mengirim chat ke {username}...")
    time.sleep(1)
    
    pyautogui.hotkey('ctrl', 'v')
    send_to_frontend("Paste pesan berhasil")
    log_message(f"Paste pesan berhasil: \n {message}")
    time.sleep(1)
    
    pyautogui.press('enter')
    send_to_frontend("Kirim pesan dengan tombol keyboard Enter berhasil")
    log_message(f"Kirim pesan dengan tombol keyboard Enter")
    
def load_order_list(order_list_path):
    if not os.path.exists(order_list_path):
        return []  # Jika file tidak ada, kembalikan list kosong
    
    try:
        with open(order_list_path, "r", encoding="utf-8") as file:
            content = file.read().strip()  # Hilangkan spasi kosong
            if not content:  # Jika kosong, kembalikan []
                return []
            return json.loads(content)  # Parse JSON dengan aman
    except json.JSONDecodeError:
        return []  # Jika error parsing JSON, kembalikan []

def save_config():
    """Simpan perubahan ke file config."""
    with open(config_file_path, "w") as file:
        json.dump(config_data, file, indent=4)

def refresh_token_func():
    """Menggunakan refresh token untuk mendapatkan token baru."""
    global token, refresh_token
    
    if not refresh_token:
        log_message("Refresh token tidak tersedia.", "warning")
        return None

    try:
        response = requests.post(
            f"{database_url}/api/user/refresh",
            json={"token": refresh_token},
            timeout=30
        )
        response.raise_for_status()
        new_token = response.json().get("token")

        if new_token:
            log_message("Token berhasil diperbarui menggunakan refresh token.", "info")
            config_data["token"] = new_token
            token = new_token
            save_config()
            return new_token
        else:
            log_message("Gagal mendapatkan token baru dari refresh token.", "error")
            return None

    except requests.exceptions.RequestException as e:
        log_message(f"Error saat refresh token: {e}", "error")
        return None

def get_token():
    """Ambil token dari backend untuk autentikasi dan simpan ke file config."""
    global token, refresh_token  # Supaya bisa di-update di luar fungsi
    login_url = f"{database_url}/api/login"
    data = {"username": USERNAME, "password": PASSWORD}

    try:
        response = requests.post(login_url, json=data)
        response.raise_for_status()
        result = response.json()
        new_token = result.get("token")
        new_refresh_token = result.get("refreshToken")

        if new_token:
            log_message("Login sukses, token diterima!", "info")
            config_data["token"] = new_token  # Simpan token ke config
            token = new_token  # Update variabel token
            
            if new_refresh_token:
                config_data["refreshToken"] = new_refresh_token
                refresh_token = new_refresh_token
                
            save_config()  # Simpan perubahan ke file
            return token
        else:
            log_message("Gagal mendapatkan token!", "error")
            return None
    except requests.exceptions.RequestException as e:
        log_message(f"Error login: {e}", "error")
        return None

def register_order_completion(order_data, result_data):
    """Mendaftarkan penyelesaian pesanan ke backend"""
    global token
    
    if not token:
        token = get_token()
        if not token:
            log_message("Tidak dapat mendaftarkan penyelesaian pesanan: token tidak tersedia", "error")
            return False
    
    try:
        # Buat payload untuk pendaftaran penyelesaian pesanan
        payload = {
            "order_id": order_data["order_sn"],
            "item_name": result_data.get("item", ""),
            "os": result_data.get("os", ""),
            "version": result_data.get("version", ""),
            "license_count": len(result_data.get("licenses", [])) if isinstance(result_data.get("licenses", []), list) else 1,
            "status": "processed"
        }
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }
        
        # Kirim permintaan ke API
        response = requests.post(
            f"{database_url}/api/orders",
            json=payload,
            headers=headers,
            timeout=30
        )
        
        # Periksa status kode
        if response.status_code == 401:  # Unauthorized
            log_message("Token tidak valid, mencoba refresh token", "warning")
            new_token = refresh_token_func()
            if not new_token:
                new_token = get_token()
            
            if new_token:
                headers["Authorization"] = f"Bearer {new_token}"
                response = requests.post(
                    f"{database_url}/api/orders",
                    json=payload,
                    headers=headers,
                    timeout=30
                )
            else:
                log_message("Gagal memperbarui token", "error")
                return False
        
        response.raise_for_status()
        
        log_message(f"Pesanan {order_data['order_sn']} berhasil didaftarkan sebagai selesai", "info")
        return True
        
    except requests.exceptions.RequestException as e:
        log_message(f"Error mendaftarkan penyelesaian pesanan: {e}", "error")
        return False

def getLicenses(order_sn, item_name, os, versi, item_amount, max_retries=None):
    """Mengambil lisensi dari backend dengan autentikasi JWT."""
    global token
    
    if max_retries is None:
        max_retries = max_retries_api
    
    # Pastikan token tidak kosong sebelum request
    if not token:
        token = get_token()

    # Jika tetap kosong setelah mencoba login, hentikan fungsi
    if not token:
        log_message("Gagal mendapatkan token, tidak bisa mengakses API!", "error")
        return None

    data = {
        "order_id": order_sn,
        "item_name": item_name,
        "os": os,
        "version": versi,
        "item_amount": item_amount
    }
    log_message(f"Data yang dikirim: \n{json.dumps(data, indent=2)}")

    retries = 0
    while retries < max_retries:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }

        try:
            response = requests.post(
                f"{database_url}/api/orders/find",
                json=data,
                headers=headers,
                timeout=60
            )

            # Deteksi token kadaluarsa atau tidak valid
            if response.status_code == 401 or response.status_code == 403:
                log_message("Token tidak valid atau kadaluarsa. Mencoba refresh token...", "warning")
                new_token = refresh_token_func()
                if new_token:
                    token = new_token
                    retries += 1
                    continue  # Coba ulangi request dengan token baru
                else:
                    log_message("Gagal refresh token. Mencoba login ulang...", "warning")
                    new_token = get_token()
                    if new_token:
                        token = new_token
                        retries += 1
                        continue
                    else:
                        log_message("Gagal login ulang.", "error")
                        return None

            response.raise_for_status()

            try:
                response_data = response.json()
                log_message(f"Response: \n{json.dumps(response_data, indent=2)}")
                return response_data
            except ValueError:
                log_message("Error: Response bukan JSON yang valid!", "error")
                return None

        except requests.exceptions.RequestException as e:
            log_message(f"Request error (percobaan {retries+1}/{max_retries}): {e}", "error")
            retries += 1
            time.sleep(2)

    log_message("Gagal mendapatkan data setelah beberapa kali percobaan.", "error")
    return None

def check_subscription_status():
    """Memeriksa status berlangganan dari pengguna."""
    global token
    
    if not token:
        token = get_token()
        if not token:
            return False
    
    try:
        headers = {
            "Authorization": f"Bearer {token}"
        }
        
        response = requests.get(f"{database_url}/api/user/profile", headers=headers, timeout=30)
        
        if response.status_code == 401 or response.status_code == 403:
            new_token = refresh_token_func()
            if new_token:
                headers["Authorization"] = f"Bearer {new_token}"
                response = requests.get(f"{database_url}/api/user/profile", headers=headers, timeout=30)
            else:
                return False
        
        response.raise_for_status()
        user_data = response.json()
        
        # Periksa apakah pengguna memiliki langganan aktif
        has_active_subscription = user_data.get("user", {}).get("hasActiveSubscription", False)
        
        if not has_active_subscription:
            log_message("Pengguna tidak memiliki langganan aktif!", "warning")
        
        return has_active_subscription
        
    except Exception as e:
        log_message(f"Error memeriksa status langganan: {e}", "error")
        return False

def get_order_statistics(start_date=None, end_date=None):
    """Mendapatkan statistik pesanan dari backend."""
    global token
    
    if not token:
        token = get_token()
        if not token:
            return None
    
    try:
        # Siapkan parameter tanggal
        if not start_date:
            # Default 30 hari ke belakang
            start_date = (datetime.now() - pd.Timedelta(days=30)).strftime("%Y-%m-%d")
        
        if not end_date:
            end_date = datetime.now().strftime("%Y-%m-%d")
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }
        
        payload = {
            "startDate": start_date,
            "endDate": end_date
        }
        
        response = requests.post(
            f"{database_url}/api/orders/count",
            json=payload,
            headers=headers,
            timeout=30
        )
        
        if response.status_code == 401 or response.status_code == 403:
            new_token = refresh_token_func()
            if new_token:
                headers["Authorization"] = f"Bearer {new_token}"
                response = requests.post(
                    f"{database_url}/api/orders/count",
                    json=payload,
                    headers=headers,
                    timeout=30
                )
            else:
                return None
        
        response.raise_for_status()
        return response.json()
        
    except Exception as e:
        log_message(f"Error mendapatkan statistik pesanan: {e}", "error")
        return None

def process_order(order):
    order_sn = order["order_sn"]
    
    items_text = ""
    found_any = False
    results_data = []

    for idx, item in enumerate(order["items"], start=1):
        order_id = f"{order_sn}-{idx}"
        item_name = item["item_name"].split(" ")[0]
        item_amount = item["item_amount"]
        description = item["item_description"]

        os_match = re.search(r"Variasi:\s*([^,]+)", description)
        os = os_match.group(1).strip() if os_match else "-"

        versi = "-"
        parts = description.split(",", 1)
        if len(parts) > 1:
            versi = parts[1].strip().replace("Versi ", "")

        result = getLicenses(order_id, item_name, os, versi, item_amount)

        if not result:
            send_to_frontend(f"❌ Data tidak ditemukan untuk {item_name} ({order_sn})")
            log_message(f"❌ Data tidak ditemukan untuk {item_name} ({order_sn})")
            continue

        found_any = True
        result_data = {
            "item": result["item"] if result["item"] else item_name,
            "os": os,
            "version": versi,
            "licenses": result["licenses"],
            "download_link": result["download_link"]
        }
        results_data.append(result_data)

        # Format lisensi untuk tampilan
        licenses_display = ", ".join(map(str, result["licenses"])) if isinstance(result["licenses"], list) else str(result["licenses"])

        items_text += item_template.format(
            item=result["item"] if result["item"] else item_name,
            licenses=licenses_display if result["licenses"] else "-",
            download_link=result["download_link"]
        ) + "\n\n"

    if not found_any:
        send_to_frontend(f"❌ Semua item dalam order {order_sn} tidak ditemukan")
        log_message(f"❌ Semua item dalam order {order_sn} tidak ditemukan")
        return None, None
    
    message = message_template.replace("{{ items }}", items_text.strip())
    return message, results_data
 
def send_to_frontend(message):
    sys.stdout.write(message + "\n")
    sys.stdout.flush()

def log_message(message, level = "info"):
    """Menulis pesan ke file log"""
    try:
        with open(log_file_path, "a", encoding="utf-8") as log_file:
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            log_file.write(f"[{timestamp}] [{level}] | main.py | {message}\n")          
    except Exception as e:
        print(f"Gagal menulis log: {e}")

def get_database_path(config_file_path, default_db_path):
    if os.path.exists(config_file_path):
        with open(config_file_path, "r") as file:
            config_data = json.load(file)
            user_db_path = config_data.get("database_path", "").strip()
            if user_db_path:
                user_db_path = os.path.abspath(os.path.expanduser(user_db_path))
                if os.path.exists(user_db_path):
                    return user_db_path
    return default_db_path

def move_and_click(x, y, with_click=True, jeda=3, duration=0.2):
    """Memindahkan kursor ke (x, y), klik jika diperlukan, lalu tunggu jeda waktu tertentu."""

    pyautogui.moveTo(x, y, duration=duration)
    time.sleep(2)
    
    if with_click:
        pyautogui.click()
        log_message(f"Klik dilakukan di ({x}, {y})") 
        
    time.sleep(jeda)

def refresh_page(i_refresh_page_path, name_icon, jeda=2, with_click=True, use_grayscale=False):
    coords = find_icon(i_refresh_page_path, use_grayscale)
    
    log_message(f"coords {name_icon}: {coords}")
    if coords:
        move_and_click(*coords, with_click, jeda)
        return True
    
    send_to_frontend(f"Gagal menemukan ikon: {i_refresh_page_path}")
    log_message(f"Gagal menemukan ikon: {i_refresh_page_path}")
    return False
    
def get_order_count():
    try:
        divTotalOrder = pyautogui.screenshot(region=(total_pesanan_x, total_pesanan_y, total_pesanan_p, total_pesanan_l))
        divTotalOrder.save(image_path) 
        
        total_order_text = pytesseract.image_to_string(Image.open(image_path), config='--psm 6').strip()
        print(f"Image path: {image_path}, OCR Result: {total_order_text}")

        total_orders = "".join(filter(str.isdigit, total_order_text))

        fix_total = int(total_orders) if total_orders else 0
        
        send_to_frontend(f"Error di get_order_count: {e}")
       log_message(f"Error di get_order_count: {e}")
       return 0  

def fetch_order_data():
   try:
       time.sleep(2)
       result = subprocess.run(command, capture_output=True, text=True)
       if result.returncode == 0:
           send_to_frontend("Data pesanan berhasil diambil")
           log_message("Data pesanan berhasil diambil")
       else:
           send_to_frontend("Error ambil data pesanan")
           log_message(f"Error ambil data pesanan: {result.stderr}")
   except Exception as e:
       log_message(f"Exception di fetch_order_data: {str(e)}")
       send_to_frontend(f"Exception di fetch_order_data: {str(e)}")

def clear_order_list():
   try:
       order_list_path = os.path.join(base_path, "sys", "order_list.json")
       with open(order_list_path, "w") as file:
           json.dump([], file)
       log_message("✅ Semua order selesai diproses dan berhasil dikosongkan")
   except Exception as e:
       log_message(f"❌ Error kosongkan order_list.json {e}")

def real_cht(order): 
   def ensure_click(icon_path, name_icon, jeda=2, position="center", with_click=True, use_grayscale=False):
       """Pastikan ikon ditemukan dan diklik. Jika tidak ditemukan, beri peringatan."""
       coords = find_icon(icon_path, use_grayscale, position)
       log_message(f"coords {name_icon}: {coords}")
       
       if coords:
           move_and_click(*coords, with_click, jeda)
           return True
       
       log_message(f"Gagal menemukan ikon: {name_icon}, coba lagi...")
       return False

   chat_opened = False
   while not chat_opened:
       if ensure_click(i_cht_path, "icon chat", 10):
           chat_opened = True
       else:
           time.sleep(3)

   while not ensure_click(i_input_msg_path, "area input", 2, position="top-left"):
       time.sleep(3)

   message, results_data = process_order(order)
   
   if message is None:
       log_message(f"❌ Order {order['order_sn']} gagal diproses, melakukan refresh dan restart...")
       send_to_frontend(f"❌ Order {order['order_sn']} gagal diproses, melakukan refresh dan restart...")
       refresh_page(i_refresh_page_path, "Refresh setelah gagal order", 10)
       
       clear_order_list()
       time.sleep(2)
       main()
       return

   log_message(f"Kirim pesan ke Buyer {order['buyer_username']}")
   log_message(f"Pesan yg dikirim: \n{message}")

   chat_process(order["buyer_username"], message)

   while not ensure_click(i_hide_cht_path, "hide pesan", 2, position="top-right"):
       time.sleep(3)

   while not ensure_click(i_send_card_path, "klik kirim card", 2):
       time.sleep(3)

   # Jika bukan testing mode, klik tombol kirim popup
   send_click_result = False
   if not testing_mode:
       send_click_result = ensure_click(i_send_popup_path, "klik kirim popup", 2, position="center")
   else:
       log_message("Mode testing aktif, melewati klik tombol kirim")
       send_click_result = True
   
   # Jika pesan berhasil dikirim, catat pesanan sebagai selesai di backend
   if send_click_result and results_data:
       for result in results_data:
           register_order_completion(order, result)
       
   clear_order_list()
   refresh_page(i_refresh_page_path, "Refresh 1x setelah selesai kerjakan order", 5)
   
   refresh_page(i_refresh_page_path, "Refresh 2x setelah selesai kerjakan order", 5)
   time.sleep(2)

def initialize_connection():
   """Inisialisasi koneksi dengan backend dan cek status langganan."""
   global token, refresh_token
   
   # Coba mendapatkan token jika belum ada
   if not token:
       token = get_token()
       if not token:
           log_message("Gagal mendapatkan token, aplikasi mungkin tidak dapat berfungsi dengan baik", "error")
           send_to_frontend("❌ Gagal terhubung dengan backend. Harap periksa koneksi internet dan kredensial")
           return False
   
   # Cek status langganan
   if not check_subscription_status():
       log_message("Pengguna tidak memiliki langganan aktif", "warning")
       send_to_frontend("⚠️ Anda tidak memiliki langganan aktif. Beberapa fitur mungkin tidak berfungsi")
       return False
   
   log_message("Koneksi dengan backend berhasil diinisialisasi", "info")
   send_to_frontend("✅ Terhubung dengan backend")
   return True

def get_periodic_stats():
   """Mendapatkan statistik secara periodik dan menampilkannya."""
   try:
       stats = get_order_statistics()
       if stats:
           total_orders = stats.get("totalOrders", 0)
           log_message(f"Statistik: Total pesanan dalam 30 hari terakhir: {total_orders}", "info")
           send_to_frontend(f"📊 Statistik: Total pesanan dalam 30 hari terakhir: {total_orders}")
   except Exception as e:
       log_message(f"Error mendapatkan statistik: {e}", "error")

def scheduled_refresh():
   """Melakukan refresh halaman secara terjadwal untuk menjaga koneksi."""
   log_message("Melakukan refresh terjadwal", "info")
   send_to_frontend("🔄 Melakukan refresh terjadwal...")
   refresh_page(i_refresh_page_path, "Refresh terjadwal", 10)

def main():
   # Inisialisasi koneksi dengan backend
   initialize_connection()
   
   # Variabel untuk menyimpan waktu terakhir refresh terjadwal
   last_refresh_time = time.time()
   last_stats_time = time.time()
   
   # Dapatkan statistik awal
   get_periodic_stats()
   
   while True:
       try:
           # Cek apakah sudah waktunya refresh terjadwal
           current_time = time.time()
           if current_time - last_refresh_time >= auto_refresh_interval:
               scheduled_refresh()
               last_refresh_time = current_time
           
           # Cek apakah sudah waktunya update statistik (setiap 1 jam)
           if current_time - last_stats_time >= 3600:
               get_periodic_stats()
               last_stats_time = current_time
           
           time.sleep(3)
           send_to_frontend("Cek Pesanan")
           log_message("Cek Pesanan")

           total_orders = get_order_count()
           order_list_path = os.path.join(base_path, "sys", "order_list.json")
           order_list = load_order_list(order_list_path)
           
           send_to_frontend(f"🔍 hasil total_order: {total_orders}")
           log_message(f"hasil total_order: {total_orders}")

           if total_orders > 0:
               send_to_frontend(f"📦 Ada {total_orders} pesanan, mengambil data...")
               log_message(f"Ada {total_orders} pesanan, mengambil data...")
               
               fetch_order_data()

               if not os.path.exists(order_list_path):
                   send_to_frontend("❌ File order_list.json tidak ditemukan! Menunggu...")
                   log_message("File order_list.json tidak ditemukan!")

                   for _ in range(12):
                       if os.path.exists(order_list_path):
                           break
                       time.sleep(5)
                   continue

               order_list = load_order_list(order_list_path)
               log_message(f"📋 load order_list: {order_list}")
               
               if not order_list or not isinstance(order_list, list) or len(order_list) == 0:
                   send_to_frontend("❌ Order list kosong atau tidak valid. Menunggu pesanan baru...")
                   log_message("Order list kosong atau tidak valid.")
                   time.sleep(10)
                   continue

               for order in order_list:
                   if not os.path.exists(order_list_path) or not load_order_list(order_list_path):
                       log_message("✅ Semua order sudah diproses dan dikosongkan. Keluar dari loop.")
                       break

                   try:
                       real_cht(order)
                       send_to_frontend(f"✅ Order {order['order_sn']} selesai diproses!\n")
                       log_message(f"Order {order['order_sn']} selesai diproses!")

                   except Exception as e:
                       log_message(f"❌ Error saat memproses order {order['order_sn']}: {str(e)}")
                       send_to_frontend(f"❌ Error order {order['order_sn']}: {str(e)}")

               send_to_frontend("✅ Semua pesanan selesai diproses. Menunggu pesanan baru...\n")
               log_message("✅ Semua pesanan selesai diproses. Menunggu pesanan baru...")

               # Menunggu hanya 2 detik sebelum cek order lagi
               time.sleep(3)

           else:
               send_to_frontend("🚀 Tidak ada pesanan saat ini. Sistem standby menunggu pesanan baru...")
               log_message("Tidak ada pesanan, menunggu 10 detik...")

               time.sleep(check_interval)
               
               # Tambahkan refresh di sini
               log_message("🔄 Melakukan refresh halaman karena tidak ada pesanan...")
               refresh_page(i_refresh_page_path, "Refresh karena tidak ada pesanan", 10)

       except Exception as e:
           error_trace = traceback.format_exc()
           log_message(f"❌ Error di main.py: {str(e)}\n{error_trace}")
           send_to_frontend(f"❌ Error di loop utama: {e}")
           time.sleep(30)

   
if __name__ == "__main__":
   main()