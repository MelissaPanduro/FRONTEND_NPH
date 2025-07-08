import { inject, Injectable, signal } from "@angular/core";
import { from, Observable, switchMap, of } from "rxjs";
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, user, User } from "@angular/fire/auth";
import { HttpClient } from "@angular/common/http";
import { UserInterface } from "../model/user.interface";
import { Router } from "@angular/router";

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private firebaseAuth = inject(Auth);
  private http = inject(HttpClient);
  private router = inject(Router); 

  user$ = user(this.firebaseAuth);
  currentUserSig = signal<UserInterface | null>(null);

  constructor() {
    this.user$.subscribe((firebaseUser: User | null) => {
      if (firebaseUser) {
        this.currentUserSig.set({
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          username: firebaseUser.displayName || '',
          displayName: firebaseUser.displayName || ''
        });
      } else {
        this.currentUserSig.set(null);
      }
    });
  }

  // 🟩 Obtener el ID Token
  private getToken(): Promise<string | null> {
    return this.firebaseAuth.currentUser?.getIdToken() ?? Promise.resolve(null);
  }

  register(email: string, username: string, password: string): Observable<any> {
    const promise = createUserWithEmailAndPassword(this.firebaseAuth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;

            return updateProfile(user, { displayName: username }).then(() => {
                return user.getIdToken().then((token) => {
                    localStorage.setItem('token', token);

                    // 🟢 Enviar los datos completos al backend
                    return this.http.post('https://8081-vallegrande-microservic-3aq4p4nrcyl.ws-us118.gitpod.io/api/auth/register', {
                        email: user.email,          // Enviar email
                        username: username,         // Enviar username
                        displayName: username,      // Enviar displayName
                        password: password          // Enviar la contraseña (si la necesitas, o puedes eliminarla)
                    }, {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                        }
                    }).toPromise();
                });
            });
        })
        .catch((error) => {
            console.error("Error en el registro:", error.message);
            throw error;
        });

    return from(promise);
}


  // 🟩 Iniciar sesión y guardar token
  login(email: string, password: string): Observable<any> {
    const promise = signInWithEmailAndPassword(this.firebaseAuth, email, password)
      .then(response => {
        return response.user.getIdToken().then(token => {
          localStorage.setItem('token', token);
          this.router.navigateByUrl('/');
        });
      });
    return from(promise);
  }

  // 🟩 Cerrar sesión
  logout(): Observable<void> {
    const promise = signOut(this.firebaseAuth).then(() => {
      localStorage.removeItem('token');
      this.router.navigateByUrl('/login');
    });
    return from(promise);
  }

  // 🟩 Obtener el usuario actual
  getCurrentUser(): UserInterface | null {
    return this.currentUserSig();
  }

  // 🟩 Verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    return this.currentUserSig() !== null;
  }

  // 🟩 Verificar token con el backend
  verifyTokenWithBackend(): Observable<any> {
    return from(this.getToken()).pipe(
      switchMap((idToken) => {
        if (idToken) {
          return this.http.get('https://8081-vallegrande-microservic-3aq4p4nrcyl.ws-us118.gitpod.io/api/auth/verifyToken', {
            headers: { Authorization: `Bearer ${idToken}` }
          });
        } else {
          return of({ error: 'No hay usuario autenticado' });
        }
      })
    );
  }
}
